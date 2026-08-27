import RequestProject.Capacity
import RequestProject.Hiring

/-!
# The capacity solver end to end

This file puts the pieces together into the solver of `engine/engine.cjs`:

1. carried seats (ramped and ramping AEs) fix the existing year-one gross;
2. the front-loaded greedy pass fixes the *number* of hires (fewest that clear,
   proved minimal in `RequestProject/Hiring.lean`);
3. a relaxation pass pushes each hire as late as feasibility allows, last seat
   first, reverting any move that would drop the plan below the requirement or
   overfill a month.

Main results:

* `NineEngines.Solver.relax_clears` — the relaxation pass never breaks the plan:
  if the schedule cleared the requirement before, it clears it after;
* `NineEngines.Solver.relax_length` — and it never changes the number of hires;
* `NineEngines.Solver.relax_feasible` — nor the per-month hire cap;
* `NineEngines.Solver.Inputs.exitArr_ge_target` — a solved plan reaches the ARR
  target whenever any schedule within the monthly cap could have.

The published `solver_default` fixture is reproduced exactly, in rational
arithmetic, in `RequestProject/SolverDefault.lean`.

## Fidelity notes

The arithmetic is rational rather than floating point, so the identities here are
exact and the reference implementation agrees with them after rounding. The only
behavioural difference is in the unreachable-target case: the reference greedy
loop stops as soon as a hire month books nothing, and reports a shortfall, while
`hireCount` returns a full year of hires (`12 * cap`) and the theorems below are
conditioned on some feasible schedule clearing the requirement.
-/

namespace NineEngines.Solver

open NineEngines.Capacity NineEngines.Hiring

/-! ## The relaxation pass -/

/-- Push one seat from month `m` as late as it will go: never past month 12,
never into a month that is already full, and never past the point where the plan
stops clearing. Mirrors the inner `while` loop of the reference implementation. -/
def bestMonth (f : ℕ → ℚ) (need : ℚ) (others : List ℕ) (cap : ℕ) : ℕ → ℕ → ℕ
  | 0, m => m
  | fuel + 1, m =>
    if 12 ≤ m then m
    else if cap ≤ others.count (m + 1) then m
    else if capacityOf f others + f (m + 1) < need then m
    else bestMonth f need others cap fuel (m + 1)

/-- Either the seat does not move, or its new month has room and the plan still
clears with it there. -/
lemma bestMonth_spec (f : ℕ → ℚ) (need : ℚ) (others : List ℕ) (cap : ℕ) :
    ∀ (fuel m : ℕ),
      bestMonth f need others cap fuel m = m ∨
        (m < bestMonth f need others cap fuel m ∧
          bestMonth f need others cap fuel m ≤ 12 ∧
          others.count (bestMonth f need others cap fuel m) < cap ∧
          need ≤ capacityOf f others + f (bestMonth f need others cap fuel m)) := by
  intro fuel
  induction fuel with
  | zero => intro m; left; rfl
  | succ fuel ih =>
    intro m
    rw [bestMonth]
    split
    · left; rfl
    · rename_i h12
      split
      · left; rfl
      · rename_i hcount
        split
        · left; rfl
        · rename_i hclear
          rcases ih (m + 1) with h | h
          · right
            rw [h]
            exact ⟨by omega, by omega, by omega, by linarith [not_lt.mp hclear]⟩
          · right
            exact ⟨by omega, h.2.1, h.2.2.1, h.2.2.2⟩

/-- The relaxation pass. `rev` is the not-yet-processed part of the schedule,
reversed, so that the last seat is handled first; `back` collects the seats
already pushed. -/
def relaxAux (f : ℕ → ℚ) (need : ℚ) (cap : ℕ) : List ℕ → List ℕ → List ℕ
  | [], back => back
  | s :: rev, back =>
    relaxAux f need cap rev (bestMonth f need (rev.reverse ++ back) cap 12 s :: back)

/-- Push every hire as late as feasibility allows, last seat first. -/
def relax (f : ℕ → ℚ) (need : ℚ) (cap : ℕ) (hs : List ℕ) : List ℕ :=
  relaxAux f need cap hs.reverse []

lemma capacityOf_append (f : ℕ → ℚ) (l₁ l₂ : List ℕ) :
    capacityOf f (l₁ ++ l₂) = capacityOf f l₁ + capacityOf f l₂ := by
  simp [capacityOf]

lemma capacityOf_cons (f : ℕ → ℚ) (a : ℕ) (l : List ℕ) :
    capacityOf f (a :: l) = f a + capacityOf f l := by
  simp [capacityOf]

/-- The relaxation pass never changes the number of hires. -/
theorem relaxAux_length (f : ℕ → ℚ) (need : ℚ) (cap : ℕ) :
    ∀ (rev back : List ℕ), (relaxAux f need cap rev back).length = rev.length + back.length := by
  intro rev
  induction rev with
  | nil => intro back; simp [relaxAux]
  | cons s rev ih => intro back; rw [relaxAux, ih]; simp; omega

theorem relax_length (f : ℕ → ℚ) (need : ℚ) (cap : ℕ) (hs : List ℕ) :
    (relax f need cap hs).length = hs.length := by
  simp [relax, relaxAux_length]

/-- **The relaxation pass never breaks the plan.** -/
theorem relaxAux_clears (f : ℕ → ℚ) (need : ℚ) (cap : ℕ) :
    ∀ (rev back : List ℕ), need ≤ capacityOf f (rev.reverse ++ back) →
      need ≤ capacityOf f (relaxAux f need cap rev back) := by
  intro rev
  induction rev with
  | nil => intro back h; simpa [relaxAux] using h
  | cons s rev ih =>
    intro back h
    rw [relaxAux]
    refine ih _ ?_
    set others := rev.reverse ++ back with hother
    have hsplit : capacityOf f ((s :: rev).reverse ++ back) = capacityOf f others + f s := by
      rw [hother, List.reverse_cons, List.append_assoc]
      rw [capacityOf_append, capacityOf_append, capacityOf_cons]
      simp [capacityOf]
      ring
    have hnew : capacityOf f (rev.reverse ++ bestMonth f need others cap 12 s :: back)
        = capacityOf f others + f (bestMonth f need others cap 12 s) := by
      rw [hother, capacityOf_append, capacityOf_append, capacityOf_cons]
      ring
    rw [hnew]
    rcases bestMonth_spec f need others cap 12 s with hb | hb
    · rw [hb]; rw [hsplit] at h; exact h
    · exact hb.2.2.2

theorem relax_clears (f : ℕ → ℚ) (need : ℚ) (cap : ℕ) (hs : List ℕ)
    (h : need ≤ capacityOf f hs) : need ≤ capacityOf f (relax f need cap hs) := by
  refine relaxAux_clears f need cap hs.reverse [] ?_
  simpa [capacityOf] using h

/-- **The relaxation pass respects the plan year and the monthly hire cap.** -/
theorem relaxAux_feasible (f : ℕ → ℚ) (need : ℚ) (cap : ℕ) :
    ∀ (rev back : List ℕ), Feasible cap (rev.reverse ++ back) →
      Feasible cap (relaxAux f need cap rev back) := by
  intro rev
  induction rev with
  | nil => intro back h; simpa [relaxAux] using h
  | cons s rev ih =>
    intro back h
    rw [relaxAux]
    refine ih _ ?_
    set others := rev.reverse ++ back with hother
    have hperm : ((s :: rev).reverse ++ back).Perm (s :: others) := by
      rw [hother, List.reverse_cons, List.append_assoc]
      exact (List.perm_append_comm_assoc _ _ _).trans (by simp)
    have hs_mem : ∀ mm ∈ others, 1 ≤ mm ∧ mm ≤ 12 := by
      intro mm hmm
      exact h.months mm (hperm.mem_iff.mpr (List.mem_cons_of_mem _ hmm))
    have hs_bounds : 1 ≤ s ∧ s ≤ 12 := h.months s (hperm.mem_iff.mpr List.mem_cons_self)
    have hcnt_le : ∀ mm, (s :: others).count mm ≤ cap := by
      intro mm
      have := h.perMonth mm
      rwa [hperm.count_eq] at this
    obtain ⟨m, hm, hmspec⟩ : ∃ m, bestMonth f need others cap 12 s = m ∧
        (m = s ∨ (s < m ∧ m ≤ 12 ∧ others.count m < cap)) := by
      refine ⟨bestMonth f need others cap 12 s, rfl, ?_⟩
      rcases bestMonth_spec f need others cap 12 s with h' | h'
      · exact Or.inl h'
      · exact Or.inr ⟨h'.1, h'.2.1, h'.2.2.1⟩
    rw [hm]
    have hnew : ∀ mm, (rev.reverse ++ m :: back).count mm
        = others.count mm + (if mm = m then 1 else 0) := by
      intro mm
      rw [hother, List.count_append, List.count_append, List.count_cons]
      by_cases hmm : mm = m
      · subst hmm; simp; omega
      · simp [Ne.symm hmm, hmm]
    have hm_bounds : 1 ≤ m ∧ m ≤ 12 := by
      rcases hmspec with rfl | hb
      · exact hs_bounds
      · exact ⟨by omega, hb.2.1⟩
    have hm_room : others.count m + 1 ≤ cap := by
      rcases hmspec with rfl | hb
      · have := hcnt_le m
        rw [List.count_cons] at this
        simpa using this
      · omega
    refine ⟨?_, ?_⟩
    · intro mm hmm
      rcases List.mem_append.mp hmm with hmm | hmm
      · exact hs_mem mm (List.mem_append.mpr (Or.inl hmm))
      · rcases List.mem_cons.mp hmm with rfl | hmm
        · exact hm_bounds
        · exact hs_mem mm (List.mem_append.mpr (Or.inr hmm))
    · intro mm
      rw [hnew mm]
      by_cases hmm : mm = m
      · rw [if_pos hmm, hmm]
        exact hm_room
      · rw [if_neg hmm, Nat.add_zero]
        have := hcnt_le mm
        rw [List.count_cons] at this
        omega

theorem relax_feasible (f : ℕ → ℚ) (need : ℚ) (cap : ℕ) (hs : List ℕ) (h : Feasible cap hs) :
    Feasible cap (relax f need cap hs) := by
  refine relaxAux_feasible f need cap hs.reverse [] ?_
  simpa using h

/-! ## The solver end to end -/

/-- The inputs of a solver run: the bridge, the unit economics, the monthly hire
cap, and the team carried into the plan year. -/
structure Inputs where
  baseArr : ℚ
  churnPct : ℚ
  expansion : ℚ
  targetArr : ℚ
  acv : ℚ
  cycleDays : ℕ
  steadyOverride : ℚ
  haircut : ℚ
  maxPerMonth : ℕ
  rampedAes : ℕ
  /-- Tenure in months, as of plan month 1, of each ramping AE carried in. -/
  rampingTenures : List ℕ
  deriving Repr

namespace Inputs

variable (i : Inputs)

/-- The ramp profile the median cycle length selects. -/
def prof : RampProfile := profileFor i.cycleDays

/-- Steady-state annual capacity of one fully ramped rep. -/
def steady : ℚ := steadyAnnual i.acv i.cycleDays i.steadyOverride

/-- Steady-state monthly capacity of one fully ramped rep. -/
def steadyMo : ℚ := i.steady / 12

/-- The bridge from base ARR to the ARR target. -/
def bridge : Bridge :=
  { baseArr := i.baseArr, churnPct := i.churnPct, expansion := i.expansion,
    targetArr := i.targetArr, haircut := i.haircut }

/-- Total length of the ramp under this profile. -/
def rampLength : ℕ := i.prof.m1 + i.prof.m2 + i.prof.m3

/-- Notional hire months of the seats carried into the plan year: a ramped AE
sits far enough back to score the full rate in every plan month, and a ramping
AE with tenure `t` at plan month 1 was hired in month `2 - t`. -/
def carriedHires : List ℤ :=
  List.replicate i.rampedAes (1 - (i.rampLength : ℤ)) ++
    i.rampingTenures.map (fun t => 2 - (t : ℤ))

/-- Year-one gross capacity of the carried team. -/
def existingGross : ℚ := (i.carriedHires.map (fun h => seatYear1 i.prof i.steadyMo h)).sum

/-- Year-one gross capacity of one new seat hired in plan month `m`. -/
def seatF : ℕ → ℚ := fun m => seatYear1 i.prof i.steadyMo m

/-- Gross capacity the new hires have to add. -/
def need : ℚ := i.bridge.grossNeeded - i.existingGross

/-- The front-loaded greedy schedule: the fewest hires that clear the
requirement, placed as early as the monthly cap allows. -/
def greedySeats : List ℕ := frontLoaded i.maxPerMonth (hireCount i.seatF i.need i.maxPerMonth)

/-- The solved hiring schedule: the greedy plan, relaxed. -/
def newSeats : List ℕ := relax i.seatF i.need i.maxPerMonth i.greedySeats

/-- Year-one gross capacity of the whole plan, carried team plus new hires. -/
def grossCapacity : ℚ := i.existingGross + capacityOf i.seatF i.newSeats

/-- ARR at the end of the plan year under the solved plan. -/
def exitArr : ℚ := i.bridge.exitArr i.grossCapacity

/-- Hiring a seat one month later never books more in year one. -/
lemma seatF_antitone (hmo : 0 ≤ i.steadyMo) (n : ℕ) : i.seatF (n + 1) ≤ i.seatF n := by
  simpa [seatF] using
    seatYear1_antitone i.prof hmo (h₁ := (n : ℤ)) (h₂ := ((n : ℤ) + 1)) (by omega)

/-- The solved schedule has exactly as many hires as the greedy one. -/
theorem newSeats_length : i.newSeats.length = hireCount i.seatF i.need i.maxPerMonth := by
  simp [newSeats, relax_length, greedySeats, frontLoaded]

/-- The solved schedule keeps every hire inside the plan year and inside the
monthly hire cap. -/
theorem newSeats_feasible (hcap : 0 < i.maxPerMonth) : Feasible i.maxPerMonth i.newSeats :=
  relax_feasible _ _ _ _
    (frontLoaded_feasible i.maxPerMonth _ hcap (hireCount_le i.seatF i.need i.maxPerMonth))

/-- **The solved schedule clears the requirement** whenever any feasible schedule
does. -/
theorem newSeats_clears (hmo : 0 ≤ i.steadyMo) (hcap : 0 < i.maxPerMonth)
    (hs : List ℕ) (hfeas : Feasible i.maxPerMonth hs) (hclear : i.need ≤ capacityOf i.seatF hs) :
    i.need ≤ capacityOf i.seatF i.newSeats :=
  relax_clears _ _ _ _
    (hireCount_clears i.seatF (i.seatF_antitone hmo) i.need i.maxPerMonth hcap hs hfeas hclear)

/-- **The solved schedule uses the fewest hires possible**: no feasible schedule
that clears the requirement is shorter. -/
theorem newSeats_minimal (hmo : 0 ≤ i.steadyMo) (hcap : 0 < i.maxPerMonth)
    (hs : List ℕ) (hfeas : Feasible i.maxPerMonth hs) (hclear : i.need ≤ capacityOf i.seatF hs) :
    i.newSeats.length ≤ hs.length := by
  rw [newSeats_length]
  exact hireCount_minimal i.seatF (i.seatF_antitone hmo) i.need i.maxPerMonth hcap hs hfeas hclear

/-- **A solved plan reaches the ARR target.** If some feasible hiring schedule
could have cleared the requirement, then the schedule the solver returns takes
exit ARR to the target. -/
theorem exitArr_ge_target (hmo : 0 ≤ i.steadyMo) (hcap : 0 < i.maxPerMonth)
    (hh : i.haircut < 1) (hs : List ℕ) (hfeas : Feasible i.maxPerMonth hs)
    (hclear : i.need ≤ capacityOf i.seatF hs) :
    i.targetArr ≤ i.exitArr := by
  have hcov : i.bridge.grossNeeded ≤ i.grossCapacity := by
    have := i.newSeats_clears hmo hcap hs hfeas hclear
    simp only [need, grossCapacity] at *
    linarith
  simpa [exitArr, bridge] using
    Bridge.exitArr_ge_target i.bridge i.grossCapacity (by simpa [bridge] using hh) hcov

end Inputs

end NineEngines.Solver
