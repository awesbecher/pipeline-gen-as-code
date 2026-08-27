import Mathlib

/-!
# The supporting build: SEs, BDRs and leadership

A formal model of the support-layer scheduling of `engine/engine.cjs`.

* Sales engineers and BDRs are scheduled off a coverage ratio (2.5 AEs per SE
  and per BDR by default): at every month of the plan there must be enough
  support seats to cover the AEs then in seat.
* Leadership loads in at stated thresholds: one Area VP per eight AEs, and none
  below five AEs.
* BDR capacity is additionally checked against the *meeting plan*: BDR pods
  carry 12 SAO points a month each and source two of every three first
  meetings, and the engine tops the BDR fleet up until it covers that.

Main results:

* `NineEngines.Support.needAt_covers` — the ratio-driven support build always
  covers the AE count;
* `NineEngines.Support.avpsFor_covers` and `avpsFor_no_slack` — one AVP per
  eight AEs, with no redundant leader;
* `NineEngines.Support.bdrFill_covers` — the BDR top-up loop terminates having
  covered the meeting plan, so reported BDR utilisation never exceeds 100%.
-/

namespace NineEngines.Support

/-! ## Ratio-driven support seats -/

/-- Support seats needed to cover `aes` AEs at `ratio` AEs per support rep. -/
def needAt (ratio : ℚ) (aes : ℕ) : ℕ := ⌈(aes : ℚ) / ratio⌉₊

/-- **The support build covers the ratio.** -/
theorem needAt_covers {ratio : ℚ} (h : 0 < ratio) (aes : ℕ) :
    (aes : ℚ) ≤ (needAt ratio aes : ℚ) * ratio := by
  have h1 : (aes : ℚ) / ratio ≤ (needAt ratio aes : ℚ) := Nat.le_ceil _
  calc (aes : ℚ) = (aes : ℚ) / ratio * ratio := by field_simp
    _ ≤ (needAt ratio aes : ℚ) * ratio := by exact mul_le_mul_of_nonneg_right h1 h.le

/-- More AEs never need fewer support seats. -/
theorem needAt_mono {ratio : ℚ} (h : 0 < ratio) : Monotone (needAt ratio) := by
  intro a b hab
  refine Nat.ceil_le_ceil ?_
  gcongr

/-- Support headcount in seat at a plan month: the carried team, topped up to the
ratio requirement of the AEs then in seat. -/
def supportHeadcount (ratio : ℚ) (existing : ℕ) (aeAt : ℕ → ℕ) (m : ℕ) : ℕ :=
  max existing (needAt ratio (aeAt m))

/-- **Coverage holds every month of the plan.** -/
theorem supportHeadcount_covers {ratio : ℚ} (h : 0 < ratio) (existing : ℕ) (aeAt : ℕ → ℕ)
    (m : ℕ) : (aeAt m : ℚ) ≤ (supportHeadcount ratio existing aeAt m : ℚ) * ratio := by
  refine (needAt_covers h (aeAt m)).trans ?_
  refine mul_le_mul_of_nonneg_right ?_ h.le
  exact_mod_cast Nat.le_max_right existing (needAt ratio (aeAt m))

/-- The support build never shrinks as AEs are added. -/
theorem supportHeadcount_mono {ratio : ℚ} (h : 0 < ratio) (existing : ℕ) {aeAt : ℕ → ℕ}
    (hae : Monotone aeAt) : Monotone (supportHeadcount ratio existing aeAt) := by
  intro a b hab
  exact max_le_max (le_refl _) (needAt_mono h (hae hab))

/-! ## Leadership -/

/-- AEs per Area VP. -/
def aesPerAvp : ℕ := 8

/-- The AE count below which no Area VP is priced. -/
def avpThreshold : ℕ := 5

/-- Area VPs the plan carries at a given AE count: one per eight AEs, none below
five AEs. -/
def avpsFor (aeCount : ℕ) : ℕ :=
  if aeCount < avpThreshold then 0 else (aeCount + aesPerAvp - 1) / aesPerAvp

/-- **Every AE has a leader.** Above the threshold, one AVP per eight AEs really
does cover the team. -/
theorem avpsFor_covers {n : ℕ} (h : avpThreshold ≤ n) : n ≤ aesPerAvp * avpsFor n := by
  unfold avpsFor aesPerAvp avpThreshold at *
  rw [if_neg (by omega)]
  omega

/-- **No redundant leader.** Dropping one AVP would leave the team uncovered. -/
theorem avpsFor_no_slack {n : ℕ} (h : avpThreshold ≤ n) :
    aesPerAvp * (avpsFor n - 1) < n := by
  unfold avpsFor aesPerAvp avpThreshold at *
  rw [if_neg (by omega)]
  omega

theorem avpsFor_eq_zero {n : ℕ} (h : n < avpThreshold) : avpsFor n = 0 := by
  simp [avpsFor, h]

theorem avpsFor_mono : Monotone avpsFor := by
  intro a b hab
  unfold avpsFor avpThreshold aesPerAvp
  split_ifs with h1 h2 <;> omega

/-! ## The BDR meeting plan -/

/-- SAO points one BDR carries per month. -/
def bdrPointsPerMonth : ℕ := 12

/-- Year-one BDR capacity in points: carried BDRs work all twelve months, a BDR
hired in month `m` works `13 - m` of them. -/
def bdrCapacity (existing : ℕ) (hires : List ℕ) : ℕ :=
  existing * 12 * bdrPointsPerMonth
    + (hires.map (fun m => (13 - m) * bdrPointsPerMonth)).sum

/-- The top-up loop: while the fleet cannot cover the meeting plan, add one BDR,
started as late as it can be and still close the remaining gap. -/
def bdrFill (needed : ℚ) (existing : ℕ) : ℕ → List ℕ → List ℕ
  | 0, acc => acc
  | fuel + 1, acc =>
    if (bdrCapacity existing acc : ℚ) < needed then
      bdrFill needed existing fuel
        (acc ++ [max 1 (min 12 (13 - ⌈(needed - bdrCapacity existing acc) / 12⌉₊))])
    else acc

lemma bdrCapacity_append (existing : ℕ) (hires : List ℕ) (m : ℕ) :
    bdrCapacity existing (hires ++ [m]) = bdrCapacity existing hires + (13 - m) * bdrPointsPerMonth := by
  simp [bdrCapacity, Nat.add_assoc]

/-- **The BDR fleet ends up covering the meeting plan.** Given enough fuel — one
pass per 144 points of gap — the top-up loop returns a fleet whose year-one
capacity meets the meetings the bookings plan implies, so reported utilisation
never exceeds 100%. -/
theorem bdrFill_covers (needed : ℚ) (existing : ℕ) :
    ∀ (fuel : ℕ) (acc : List ℕ), needed ≤ 144 * fuel + (bdrCapacity existing acc : ℚ) →
      needed ≤ (bdrCapacity existing (bdrFill needed existing fuel acc) : ℚ) := by
  intro fuel
  induction fuel with
  | zero => intro acc h; simpa [bdrFill] using h
  | succ fuel ih =>
    intro acc h
    rw [bdrFill]
    split
    · rename_i hlt
      set gap : ℚ := needed - (bdrCapacity existing acc : ℚ) with hgap
      have hgap_pos : 0 < gap := by simp [hgap]; linarith
      set c : ℕ := ⌈gap / 12⌉₊ with hc
      have hc_pos : 1 ≤ c := by
        rw [hc]
        exact Nat.one_le_iff_ne_zero.mpr (by
          simp only [ne_eq, Nat.ceil_eq_zero, not_le]
          positivity)
      refine ih _ ?_
      rw [bdrCapacity_append]
      by_cases hcle : c ≤ 12
      · -- one BDR started in month `13 - c` closes the whole gap
        have hm : max 1 (min 12 (13 - c)) = 13 - c := by omega
        rw [hm]
        have h13 : 13 - (13 - c) = c := by omega
        rw [h13]
        have hcov : gap ≤ (c : ℚ) * 12 := by
          have := Nat.le_ceil (gap / 12)
          rw [← hc] at this
          calc gap = gap / 12 * 12 := by ring
            _ ≤ (c : ℚ) * 12 := by exact mul_le_mul_of_nonneg_right this (by norm_num)
        have : ((c * bdrPointsPerMonth : ℕ) : ℚ) = (c : ℚ) * 12 := by
          simp [bdrPointsPerMonth]
        push_cast
        simp only [bdrPointsPerMonth]
        push_cast
        have hfuel : (0 : ℚ) ≤ 144 * fuel := by positivity
        linarith [hgap ▸ hcov]
      · -- the gap is more than one BDR-year: start one in month 1 and recurse
        have hm : max 1 (min 12 (13 - c)) = 1 := by omega
        rw [hm]
        simp only [bdrPointsPerMonth]
        push_cast
        push_cast at h
        linarith
    · rename_i hge
      exact not_lt.mp hge

end NineEngines.Support
