import Mathlib

/-!
# The sales capacity model: ramp, seat capacity, and the bridge

A formal model of the core arithmetic of `engine/engine.cjs` from
`pipeline-gen-as-code`.

The model is stated over the rationals rather than floating point, so every
identity below is exact; the reference implementation computes the same numbers
in IEEE doubles and therefore agrees to within rounding.

Contents:

* ramp profiles and the locked ramp vector `0 / 0.5 / 0.9 / 1` per tenure
  quarter, and its monotonicity;
* a seat's year-one gross capacity as a function of its hire month, and the fact
  that hiring later never produces more;
* the bridge from base ARR to exit ARR, and the theorem that a plan whose gross
  capacity covers the gross requirement really does reach the ARR target.
-/

namespace NineEngines.Capacity

/-- A ramp profile: the number of months spent at each of the first three ramp
rates. The reference implementation uses `2/2/2` for fast cycles, `3/3/3` for
the playbook standard and `4/4/4` for enterprise cycles. -/
structure RampProfile where
  m1 : ℕ
  m2 : ℕ
  m3 : ℕ
  m1_pos : 0 < m1
  deriving Repr

/-- Fast-cycle ramp, for cycles under 120 days. -/
def fastRamp : RampProfile := ⟨2, 2, 2, by norm_num⟩

/-- Playbook standard ramp, for 120 to 220-day cycles. -/
def stdRamp : RampProfile := ⟨3, 3, 3, by norm_num⟩

/-- Enterprise ramp, for cycles over 220 days. -/
def longRamp : RampProfile := ⟨4, 4, 4, by norm_num⟩

/-- The ramp profile a median cycle length selects. -/
def profileFor (cycleDays : ℕ) : RampProfile :=
  if cycleDays < 120 then fastRamp else if cycleDays ≤ 220 then stdRamp else longRamp

/-- The locked ramp vector: a rep at tenure month `t` sells at 0, then 50%, then
90%, then 100% of steady state. Tenure months at or below zero score zero. -/
def rampRate (p : RampProfile) (t : ℤ) : ℚ :=
  if t ≤ (p.m1 : ℤ) then 0
  else if t ≤ (p.m1 : ℤ) + p.m2 then 1/2
  else if t ≤ (p.m1 : ℤ) + p.m2 + p.m3 then 9/10
  else 1

lemma rampRate_nonneg (p : RampProfile) (t : ℤ) : 0 ≤ rampRate p t := by
  unfold rampRate; split_ifs <;> norm_num

lemma rampRate_le_one (p : RampProfile) (t : ℤ) : rampRate p t ≤ 1 := by
  unfold rampRate; split_ifs <;> norm_num

/-- Ramp productivity never goes backwards as a rep gains tenure. -/
lemma rampRate_mono (p : RampProfile) : Monotone (rampRate p) := by
  intro s t hst
  unfold rampRate
  split_ifs <;> (try omega) <;> norm_num

/-- Before the end of the first ramp band a rep sells nothing. -/
lemma rampRate_eq_zero (p : RampProfile) {t : ℤ} (h : t ≤ (p.m1 : ℤ)) : rampRate p t = 0 := by
  simp [rampRate, h]

/-- The twelve calendar months of the plan year. -/
def planMonths : Finset ℤ := Finset.Icc 1 12

/-- What one seat books in calendar month `c` of the plan, given its hire month
(which may be zero or negative for a rep carried in). -/
def seatMonth (p : RampProfile) (steadyMo : ℚ) (hire c : ℤ) : ℚ :=
  rampRate p (c - hire + 1) * steadyMo

/-- Year-one gross capacity of one seat hired in month `hire`. -/
def seatYear1 (p : RampProfile) (steadyMo : ℚ) (hire : ℤ) : ℚ :=
  ∑ c ∈ planMonths, seatMonth p steadyMo hire c

lemma seatYear1_nonneg (p : RampProfile) {steadyMo : ℚ} (hs : 0 ≤ steadyMo) (hire : ℤ) :
    0 ≤ seatYear1 p steadyMo hire := by
  refine Finset.sum_nonneg fun c _ => ?_
  exact mul_nonneg (rampRate_nonneg p _) hs

/-- **Hiring later never books more.** Year-one capacity is antitone in the hire
month. -/
theorem seatYear1_antitone (p : RampProfile) {steadyMo : ℚ} (hs : 0 ≤ steadyMo)
    {h₁ h₂ : ℤ} (h : h₁ ≤ h₂) : seatYear1 p steadyMo h₂ ≤ seatYear1 p steadyMo h₁ := by
  refine Finset.sum_le_sum fun c _ => ?_
  exact mul_le_mul_of_nonneg_right (rampRate_mono p (by omega)) hs

/-- A seat hired too late to leave its first ramp band books nothing in year one. -/
theorem seatYear1_eq_zero_of_late (p : RampProfile) (steadyMo : ℚ) {hire : ℤ}
    (h : 13 - (p.m1 : ℤ) ≤ hire) : seatYear1 p steadyMo hire = 0 := by
  refine Finset.sum_eq_zero fun c hc => ?_
  have hc12 : c ≤ 12 := (Finset.mem_Icc.mp hc).2
  have : c - hire + 1 ≤ (p.m1 : ℤ) := by omega
  simp [seatMonth, rampRate_eq_zero p this]

/-- A seat never books more than twelve months of steady state. -/
theorem seatYear1_le (p : RampProfile) {steadyMo : ℚ} (hs : 0 ≤ steadyMo) (hire : ℤ) :
    seatYear1 p steadyMo hire ≤ 12 * steadyMo := by
  have : ∑ c ∈ planMonths, seatMonth p steadyMo hire c ≤ ∑ _c ∈ planMonths, steadyMo := by
    refine Finset.sum_le_sum fun c _ => ?_
    calc rampRate p (c - hire + 1) * steadyMo ≤ 1 * steadyMo :=
          mul_le_mul_of_nonneg_right (rampRate_le_one p _) hs
      _ = steadyMo := one_mul _
  simpa [planMonths, seatYear1] using this

/-! ## Unit economics -/

/-- Deals a fully ramped rep closes in a year at the anchor cycle. -/
def anchorDealsPerYear : ℚ := 83333 / 10000

/-- The anchor median cycle, in days. -/
def anchorCycleDays : ℚ := 178

/-- Steady-state capacity is capped at three million a year per rep. -/
def steadyCap : ℚ := 3000000

/-- Steady-state annual capacity of one fully ramped rep, derived from ACV and
cycle length unless overridden. -/
def steadyAnnual (acv cycleDays : ℚ) (override : ℚ) : ℚ :=
  if 0 < override then override
  else min steadyCap (anchorDealsPerYear * anchorCycleDays / cycleDays * acv)

lemma steadyAnnual_nonneg {acv cycleDays override : ℚ} (hacv : 0 ≤ acv) (hc : 0 < cycleDays)
    (ho : 0 ≤ override) : 0 ≤ steadyAnnual acv cycleDays override := by
  unfold steadyAnnual
  split_ifs with h
  · exact ho
  · refine le_min (by norm_num [steadyCap]) ?_
    have : 0 ≤ anchorDealsPerYear * anchorCycleDays / cycleDays := by
      apply div_nonneg _ hc.le
      norm_num [anchorDealsPerYear, anchorCycleDays]
    exact mul_nonneg this hacv

/-! ## The bridge from base ARR to exit ARR -/

/-- The bridge inputs: where ARR starts, what it leaks and gains, where it must
land, and the haircut from gross capacity to net new ARR. -/
structure Bridge where
  baseArr : ℚ
  churnPct : ℚ
  expansion : ℚ
  targetArr : ℚ
  haircut : ℚ
  deriving Repr

namespace Bridge

/-- Gross churn on the base. -/
def churnD (b : Bridge) : ℚ := b.baseArr * b.churnPct

/-- Expansion net of churn. -/
def expansionNet (b : Bridge) : ℚ := b.expansion - b.churnD

/-- Net new ARR the plan has to produce. -/
def netNewNeeded (b : Bridge) : ℚ := b.targetArr - b.baseArr - b.expansionNet

/-- Gross capacity the plan has to produce, before the haircut. -/
def grossNeeded (b : Bridge) : ℚ :=
  if 0 < b.netNewNeeded then b.netNewNeeded / (1 - b.haircut) else 0

/-- Net new ARR from a given gross capacity. -/
def netNewLogo (b : Bridge) (grossCapacity : ℚ) : ℚ := grossCapacity * (1 - b.haircut)

/-- ARR at the end of the plan year. -/
def exitArr (b : Bridge) (grossCapacity : ℚ) : ℚ :=
  b.baseArr + b.expansionNet + b.netNewLogo grossCapacity

/-- Gross capacity still missing from the requirement. -/
def shortfall (b : Bridge) (grossCapacity : ℚ) : ℚ := max 0 (b.grossNeeded - grossCapacity)

lemma grossNeeded_nonneg (b : Bridge) (hh : b.haircut < 1) : 0 ≤ b.grossNeeded := by
  unfold grossNeeded
  split_ifs with h
  · exact le_of_lt (div_pos h (by linarith))
  · exact le_refl 0

/-- **The bridge closes.** If the plan's gross capacity meets the gross
requirement then exit ARR meets the ARR target. -/
theorem exitArr_ge_target (b : Bridge) (grossCapacity : ℚ) (hh : b.haircut < 1)
    (hcov : b.grossNeeded ≤ grossCapacity) : b.targetArr ≤ b.exitArr grossCapacity := by
  have hpos : 0 < 1 - b.haircut := by linarith
  have key : b.netNewNeeded ≤ b.netNewLogo grossCapacity := by
    unfold netNewLogo
    by_cases h : 0 < b.netNewNeeded
    · have hgn : b.grossNeeded = b.netNewNeeded / (1 - b.haircut) := by simp [grossNeeded, h]
      rw [hgn] at hcov
      calc b.netNewNeeded = b.netNewNeeded / (1 - b.haircut) * (1 - b.haircut) := by
            field_simp
        _ ≤ grossCapacity * (1 - b.haircut) := by
            exact mul_le_mul_of_nonneg_right hcov hpos.le
    · push_neg at h
      have hgn : b.grossNeeded = 0 := by simp [grossNeeded, not_lt.mpr h]
      rw [hgn] at hcov
      have : 0 ≤ grossCapacity * (1 - b.haircut) := mul_nonneg hcov hpos.le
      linarith
  unfold exitArr netNewNeeded at *
  linarith

/-- The shortfall is zero exactly when the requirement is covered. -/
theorem shortfall_eq_zero_iff (b : Bridge) (grossCapacity : ℚ) :
    b.shortfall grossCapacity = 0 ↔ b.grossNeeded ≤ grossCapacity := by
  unfold shortfall
  constructor
  · intro h
    by_contra hcon
    push_neg at hcon
    rw [max_eq_right (by linarith)] at h
    linarith
  · intro h
    exact max_eq_left (by linarith)

end Bridge

end NineEngines.Capacity
