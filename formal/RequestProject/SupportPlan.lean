import RequestProject.Support
import RequestProject.SolverDefault

/-!
# The supporting build: ratio schedule and the meeting plan

`engine/engine.cjs` staffs SEs and BDRs in two passes:

1. a *ratio* pass walks the plan year month by month and hires whenever the
   support headcount in seat falls below the AE ratio; then
2. for BDRs only, a *meeting* pass tops the fleet up until its year-one SAO
   capacity covers the first meetings the bookings plan implies — the reference
   notes that scheduling on the ratio alone is what once let a plan report
   "clears" at 118% BDR utilisation.

Main results:

* `NineEngines.Support.ratioHires_covers` — after the ratio pass the support
  headcount in seat meets the ratio in *every* month of the plan;
* `NineEngines.Support.bdrPlan_covers_meetings` — after the meeting pass the
  fleet's year-one capacity covers the meeting plan, so utilisation never
  exceeds 100%;
* `NineEngines.Support.bdrPlan_covers_ratio` — and the meeting pass never
  undoes ratio coverage, because it only ever adds BDRs;
* `NineEngines.Support.solverDefault_*` — the supporting build of the published
  `solver_default` fixture, reproduced exactly.
-/

namespace NineEngines.Support

open NineEngines.Solver NineEngines.Capacity

/-! ## The ratio pass -/

/-- Walk the given months in order, hiring whenever the headcount in seat (`cur`)
falls below the ratio requirement of the AEs then in seat. -/
def ratioAux (perAe : ℚ) (aeAt : ℕ → ℕ) : List ℕ → ℕ → List ℕ
  | [], _ => []
  | m :: ms, cur =>
    if cur < needAt perAe (aeAt m) then
      List.replicate (needAt perAe (aeAt m) - cur) m
        ++ ratioAux perAe aeAt ms (needAt perAe (aeAt m))
    else ratioAux perAe aeAt ms cur

/-- The twelve months of the plan year. -/
def planMonthsList : List ℕ := [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

/-- The support hires the ratio pass makes over the plan year. -/
def ratioHires (perAe : ℚ) (existing : ℕ) (aeAt : ℕ → ℕ) : List ℕ :=
  ratioAux perAe aeAt planMonthsList existing

/-- Support headcount in seat at plan month `m`. -/
def headcountAt (existing : ℕ) (hires : List ℕ) (m : ℕ) : ℕ :=
  existing + hires.countP (fun x => decide (x ≤ m))

lemma headcountAt_mono_hires (existing : ℕ) (hires extra : List ℕ) (m : ℕ) :
    headcountAt existing hires m ≤ headcountAt existing (hires ++ extra) m := by
  simp [headcountAt, List.countP_append]

/-- The ratio pass leaves enough support in seat in every month it walks. -/
theorem ratioAux_covers (perAe : ℚ) (aeAt : ℕ → ℕ) :
    ∀ (ms : List ℕ), ms.Pairwise (· ≤ ·) → ∀ (cur : ℕ), ∀ m ∈ ms,
      needAt perAe (aeAt m) ≤
        cur + (ratioAux perAe aeAt ms cur).countP (fun x => decide (x ≤ m)) := by
  intro ms
  induction ms with
  | nil => intro _ _ m hm; cases hm
  | cons m₀ ms ih =>
    intro hsorted cur m hm
    have hsorted' : ms.Pairwise (· ≤ ·) := List.Pairwise.of_cons hsorted
    have hhead : ∀ x ∈ ms, m₀ ≤ x := (List.pairwise_cons.mp hsorted).1
    rw [ratioAux]
    split
    · rename_i hlt
      rw [List.countP_append, List.countP_replicate]
      rcases List.mem_cons.mp hm with rfl | hmem
      · simp only [le_refl, decide_true, if_pos]
        omega
      · have hm₀ : m₀ ≤ m := hhead m hmem
        have hcount : (if (decide (m₀ ≤ m)) = true then needAt perAe (aeAt m₀) - cur else 0)
            = needAt perAe (aeAt m₀) - cur := by simp [hm₀]
        rw [hcount]
        have := ih hsorted' (needAt perAe (aeAt m₀)) m hmem
        omega
    · rename_i hge
      rcases List.mem_cons.mp hm with rfl | hmem
      · omega
      · have := ih hsorted' cur m hmem
        omega

/-- **The ratio pass covers the ratio every month.** -/
theorem ratioHires_covers (perAe : ℚ) (existing : ℕ) (aeAt : ℕ → ℕ) {m : ℕ}
    (hm : m ∈ planMonthsList) :
    needAt perAe (aeAt m) ≤ headcountAt existing (ratioHires perAe existing aeAt) m := by
  have hsorted : planMonthsList.Pairwise (· ≤ ·) := by
    simp [planMonthsList]
  exact ratioAux_covers perAe aeAt planMonthsList hsorted existing m hm

/-- The same statement in ratio form: the AEs in seat are covered by the support
in seat, month by month. -/
theorem ratioHires_ratio_covered {perAe : ℚ} (h : 0 < perAe) (existing : ℕ) (aeAt : ℕ → ℕ)
    {m : ℕ} (hm : m ∈ planMonthsList) :
    (aeAt m : ℚ) ≤ (headcountAt existing (ratioHires perAe existing aeAt) m : ℚ) * perAe := by
  refine (needAt_covers h (aeAt m)).trans (mul_le_mul_of_nonneg_right ?_ h.le)
  exact_mod_cast ratioHires_covers perAe existing aeAt hm

/-! ## The meeting pass -/

/-- Wins per first meeting: 16% meeting-to-qualified, 27% qualified-to-POV, 81%
POV-to-win. -/
def winPerMtg : ℚ := 16/100 * (27/100) * (81/100)

/-- Share of first meetings a BDR pod sources. -/
def bdrMeetingShare : ℚ := 2/3

/-- First meetings the bookings plan implies. -/
def meetingsNeeded (netNewLogo acv : ℚ) : ℕ :=
  if 0 < netNewLogo then ⌈netNewLogo / acv / winPerMtg⌉₊ else 0

/-- SAO points the BDR fleet has to carry. -/
def bdrMeetings (netNewLogo acv : ℚ) : ℚ := (meetingsNeeded netNewLogo acv : ℚ) * bdrMeetingShare

/-- The BDR build: the ratio pass, topped up until the fleet covers the meeting
plan. -/
def bdrPlan (netNewLogo acv perAe : ℚ) (existing : ℕ) (aeAt : ℕ → ℕ) (fuel : ℕ) : List ℕ :=
  bdrFill (bdrMeetings netNewLogo acv) existing fuel (ratioHires perAe existing aeAt)

lemma bdrFill_stops (needed : ℚ) (existing fuel : ℕ) (acc : List ℕ)
    (h : ¬ (bdrCapacity existing acc : ℚ) < needed) :
    bdrFill needed existing fuel acc = acc := by
  cases fuel with
  | zero => rfl
  | succ n => rw [bdrFill]; simp [h]

lemma bdrFill_step (needed : ℚ) (existing fuel : ℕ) (acc : List ℕ)
    (h : (bdrCapacity existing acc : ℚ) < needed) :
    bdrFill needed existing (fuel + 1) acc =
      bdrFill needed existing fuel
        (acc ++ [max 1 (min 12 (13 - ⌈(needed - bdrCapacity existing acc) / 12⌉₊))]) := by
  rw [bdrFill]; simp [h]

/-- The meeting pass only ever adds BDRs. -/
lemma bdrFill_append (needed : ℚ) (existing : ℕ) :
    ∀ (fuel : ℕ) (acc : List ℕ), ∃ extra, bdrFill needed existing fuel acc = acc ++ extra := by
  intro fuel
  induction fuel with
  | zero => intro acc; exact ⟨[], by simp [bdrFill]⟩
  | succ fuel ih =>
    intro acc
    by_cases h : (bdrCapacity existing acc : ℚ) < needed
    · obtain ⟨extra, hextra⟩ := ih (acc ++ [max 1 (min 12
        (13 - ⌈(needed - bdrCapacity existing acc) / 12⌉₊))])
      exact ⟨_, by rw [bdrFill_step needed existing fuel acc h, hextra, List.append_assoc]⟩
    · exact ⟨[], by simp [bdrFill_stops needed existing _ acc h]⟩

/-- **The BDR build covers the meeting plan**, so reported utilisation never
exceeds 100%. -/
theorem bdrPlan_covers_meetings (netNewLogo acv perAe : ℚ) (existing : ℕ) (aeAt : ℕ → ℕ)
    (fuel : ℕ)
    (hfuel : bdrMeetings netNewLogo acv ≤
      144 * fuel + (bdrCapacity existing (ratioHires perAe existing aeAt) : ℚ)) :
    bdrMeetings netNewLogo acv ≤
      (bdrCapacity existing (bdrPlan netNewLogo acv perAe existing aeAt fuel) : ℚ) :=
  bdrFill_covers _ _ fuel _ hfuel

/-- **The BDR build still covers the ratio**: topping up for the meeting plan
never removes a seat. -/
theorem bdrPlan_covers_ratio {perAe : ℚ} (h : 0 < perAe) (netNewLogo acv : ℚ) (existing : ℕ)
    (aeAt : ℕ → ℕ) (fuel : ℕ) {m : ℕ} (hm : m ∈ planMonthsList) :
    (aeAt m : ℚ) ≤
      (headcountAt existing (bdrPlan netNewLogo acv perAe existing aeAt fuel) m : ℚ) * perAe := by
  obtain ⟨extra, hextra⟩ := bdrFill_append (bdrMeetings netNewLogo acv) existing fuel
    (ratioHires perAe existing aeAt)
  refine (ratioHires_ratio_covered h existing aeAt hm).trans (mul_le_mul_of_nonneg_right ?_ h.le)
  have := headcountAt_mono_hires existing (ratioHires perAe existing aeAt) extra m
  rw [bdrPlan, hextra]
  exact_mod_cast this

/-! ## Regression: the supporting build at the published defaults -/

/-- AEs in seat at plan month `m` under the solved default plan: four carried,
plus the new hires already started. -/
def aeAtDefault (m : ℕ) : ℕ := 4 + solverDefault.newSeats.countP (fun x => decide (x ≤ m))

private lemma ae_1 : aeAtDefault 1 = 6 := by rw [aeAtDefault, solverDefault_newSeats]; rfl
private lemma ae_2 : aeAtDefault 2 = 8 := by rw [aeAtDefault, solverDefault_newSeats]; rfl
private lemma ae_3 : aeAtDefault 3 = 10 := by rw [aeAtDefault, solverDefault_newSeats]; rfl
private lemma ae_4 : aeAtDefault 4 = 10 := by rw [aeAtDefault, solverDefault_newSeats]; rfl
private lemma ae_5 : aeAtDefault 5 = 11 := by rw [aeAtDefault, solverDefault_newSeats]; rfl
private lemma ae_6 : aeAtDefault 6 = 11 := by rw [aeAtDefault, solverDefault_newSeats]; rfl
private lemma ae_7 : aeAtDefault 7 = 11 := by rw [aeAtDefault, solverDefault_newSeats]; rfl
private lemma ae_8 : aeAtDefault 8 = 11 := by rw [aeAtDefault, solverDefault_newSeats]; rfl
private lemma ae_9 : aeAtDefault 9 = 11 := by rw [aeAtDefault, solverDefault_newSeats]; rfl
private lemma ae_10 : aeAtDefault 10 = 11 := by rw [aeAtDefault, solverDefault_newSeats]; rfl
private lemma ae_11 : aeAtDefault 11 = 11 := by rw [aeAtDefault, solverDefault_newSeats]; rfl
private lemma ae_12 : aeAtDefault 12 = 11 := by rw [aeAtDefault, solverDefault_newSeats]; rfl

/-- Four AEs carried in need two support seats at the 2.5 ratio. -/
lemma solverDefault_existingSupport : needAt (5/2) 4 = 2 := by norm_num [needAt]

/-- The ratio pass hires in months 1, 2 and 5. Fixture `total_ses`: five SEs. -/
theorem solverDefault_ratioHires : ratioHires (5/2) 2 aeAtDefault = [1, 2, 5] := by
  norm_num [ratioHires, ratioAux, planMonthsList, needAt, ae_1, ae_2, ae_3, ae_4, ae_5, ae_6,
    ae_7, ae_8, ae_9, ae_10, ae_11, ae_12]

theorem solverDefault_totalSes : 2 + (ratioHires (5/2) 2 aeAtDefault).length = 5 := by
  rw [solverDefault_ratioHires]; rfl

/-- Fixture `bdr_meetings_required`: 777.33 SAO points, which the reference
rounds to 777. -/
theorem solverDefault_bdrMeetings : bdrMeetings (489414709/100) 120000 = 2332/3 := by
  norm_num [bdrMeetings, meetingsNeeded, winPerMtg, bdrMeetingShare]

/-- Fixture `new_bdr_hire_months`: 1, 2, 3, 5 (the reference sorts the list; the
meeting pass appends its month-3 hire last). -/
theorem solverDefault_bdrPlan :
    bdrPlan (489414709/100) 120000 (5/2) 2 aeAtDefault 500 = [1, 2, 5, 3] := by
  rw [bdrPlan, solverDefault_bdrMeetings, solverDefault_ratioHires,
    show (500 : ℕ) = 499 + 1 from rfl,
    bdrFill_step _ _ _ _ (by norm_num [bdrCapacity, bdrPointsPerMonth])]
  norm_num [bdrCapacity, bdrPointsPerMonth]
  exact bdrFill_stops _ _ _ _ (by norm_num [bdrCapacity, bdrPointsPerMonth])

/-- Fixture `total_bdrs`: six BDRs. -/
theorem solverDefault_totalBdrs :
    2 + (bdrPlan (489414709/100) 120000 (5/2) 2 aeAtDefault 500).length = 6 := by
  rw [solverDefault_bdrPlan]; rfl

/-- Fixture `bdr_capacity_points`: 780 SAO points. -/
theorem solverDefault_bdrCapacity :
    bdrCapacity 2 (bdrPlan (489414709/100) 120000 (5/2) 2 aeAtDefault 500) = 780 := by
  rw [solverDefault_bdrPlan]; rfl

/-- Fixture `status.bdr_support = clears`: the fleet covers the meeting plan,
i.e. utilisation is at most 100%. -/
theorem solverDefault_bdrClears :
    bdrMeetings (489414709/100) 120000 ≤
      (bdrCapacity 2 (bdrPlan (489414709/100) 120000 (5/2) 2 aeAtDefault 500) : ℚ) := by
  rw [solverDefault_bdrCapacity, solverDefault_bdrMeetings]; norm_num

end NineEngines.Support
