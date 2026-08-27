import RequestProject.Capacity

/-!
# The hiring solver: front-loading is optimal, and the hire count is minimal

The capacity engine of `pipeline-gen-as-code` states its solver contract as:

> 1. Add up to `adv.maxPerMonth` seats per month, front-loaded, until year-1
>    gross clears `grossNeeded`.
> 2. Then push each hire as late as possible while the target still clears and
>    no month exceeds `adv.maxPerMonth`.
>
> Objective: fewest hires, then latest feasible start dates.

This file proves the first half of that objective. A hiring schedule is a list
of hire months, each in the plan year and with at most `cap` hires in any one
month. Writing `f m` for the year-one gross capacity of a seat hired in month
`m` — antitone and nonnegative, by `NineEngines.Capacity.seatYear1_antitone` —
we show:

* `NineEngines.Hiring.capacityOf_le_frontLoaded` : no schedule of `n` hires
  books more in year one than the front-loaded schedule of `n` hires;
* `NineEngines.Hiring.hireCount_minimal` : consequently, no schedule with fewer
  hires than the solver's clears the requirement. The solver really does return
  the fewest hires that clear.
-/

namespace NineEngines.Hiring

open Finset

/-- Year-one gross capacity of a schedule, given per-seat capacities `f`. -/
def capacityOf (f : ℕ → ℚ) (hs : List ℕ) : ℚ := (hs.map f).sum

/-- The front-loaded schedule of `n` hires at up to `cap` per month:
months `1,1,…,2,2,…`. -/
def frontLoaded (cap n : ℕ) : List ℕ := (List.range n).map (fun i => i / cap + 1)

@[simp] lemma length_frontLoaded (cap n : ℕ) : (frontLoaded cap n).length = n := by
  simp [frontLoaded]

/-- A schedule is *feasible* when every hire falls in the plan year and no month
takes more than `cap` hires. -/
structure Feasible (cap : ℕ) (hs : List ℕ) : Prop where
  months : ∀ m ∈ hs, 1 ≤ m ∧ m ≤ 12
  perMonth : ∀ m, hs.count m ≤ cap

/-! ## Counting hires by month -/

lemma sum_counts_length (hs : List ℕ) (hmem : ∀ m ∈ hs, 1 ≤ m ∧ m ≤ 12) :
    ∑ i ∈ range 12, hs.count (i + 1) = hs.length := by
  induction hs with
  | nil => simp
  | cons a t ih =>
    have ha := hmem a (List.mem_cons_self)
    have ht : ∀ m ∈ t, 1 ≤ m ∧ m ≤ 12 := fun m hm => hmem m (List.mem_cons_of_mem _ hm)
    have hsplit : ∀ i, (a :: t).count (i + 1) = t.count (i + 1) + (if i + 1 = a then 1 else 0) := by
      intro i
      rw [List.count_cons]
      by_cases h : i + 1 = a
      · subst h; simp
      · simp [h, Ne.symm h]
    simp only [hsplit, Finset.sum_add_distrib, ih ht]
    have : ∑ i ∈ range 12, (if i + 1 = a then 1 else 0) = 1 := by
      rw [Finset.sum_eq_single (a - 1)]
      · simp [Nat.sub_add_cancel ha.1]
      · intro b _ hb
        have : b + 1 ≠ a := by omega
        simp [this]
      · intro hcon
        exact absurd (Finset.mem_range.mpr (by omega)) hcon
    rw [this, List.length_cons]

lemma capacityOf_eq_sum_counts (f : ℕ → ℚ) (hs : List ℕ) (hmem : ∀ m ∈ hs, 1 ≤ m ∧ m ≤ 12) :
    capacityOf f hs = ∑ i ∈ range 12, (hs.count (i + 1) : ℚ) * f (i + 1) := by
  induction hs with
  | nil => simp [capacityOf]
  | cons a t ih =>
    have ha := hmem a (List.mem_cons_self)
    have ht : ∀ m ∈ t, 1 ≤ m ∧ m ≤ 12 := fun m hm => hmem m (List.mem_cons_of_mem _ hm)
    have hsplit : ∀ i, ((a :: t).count (i + 1) : ℚ)
        = (t.count (i + 1) : ℚ) + (if i + 1 = a then 1 else 0) := by
      intro i
      rw [List.count_cons]
      by_cases h : i + 1 = a
      · subst h; simp
      · simp [h, Ne.symm h]
    have hone : ∑ i ∈ range 12, (if i + 1 = a then (1 : ℚ) else 0) * f (i + 1) = f a := by
      rw [Finset.sum_eq_single (a - 1)]
      · simp [Nat.sub_add_cancel ha.1]
      · intro b _ hb
        have : b + 1 ≠ a := by omega
        simp [this]
      · intro hcon
        exact absurd (Finset.mem_range.mpr (by omega)) hcon
    simp only [capacityOf, List.map_cons, List.sum_cons, hsplit, add_mul,
      Finset.sum_add_distrib, hone]
    rw [← capacityOf, ih ht]
    ring

/-- Hires in the first `k` months of a feasible schedule: at most `cap` a month,
and never more than the whole schedule. -/
lemma prefix_le_cap (cap : ℕ) (hs : List ℕ) (hfeas : Feasible cap hs) (k : ℕ) :
    ∑ i ∈ range k, hs.count (i + 1) ≤ cap * k := by
  calc ∑ i ∈ range k, hs.count (i + 1) ≤ ∑ _i ∈ range k, cap :=
        Finset.sum_le_sum fun i _ => hfeas.perMonth (i + 1)
    _ = cap * k := by simp [Nat.mul_comm]

lemma prefix_le_length (hs : List ℕ) (hmem : ∀ m ∈ hs, 1 ≤ m ∧ m ≤ 12) {k : ℕ} (hk : k ≤ 12) :
    ∑ i ∈ range k, hs.count (i + 1) ≤ hs.length := by
  rw [← sum_counts_length hs hmem]
  exact Finset.sum_le_sum_of_subset (Finset.range_mono hk)

/-! ## The front-loaded schedule -/

lemma nat_div_eq_iff (cap n m : ℕ) (hcap : 0 < cap) :
    (n / cap = m) ↔ (cap * m ≤ n ∧ n < cap * m + cap) := by
  have hc : ∀ x : ℕ, x * cap = cap * x := fun x => Nat.mul_comm _ _
  constructor
  · rintro rfl
    have h1 := Nat.div_add_mod n cap
    have h2 := Nat.mod_lt n hcap
    omega
  · rintro ⟨h1, h2⟩
    refine Nat.div_eq_of_lt_le ?_ ?_
    · rw [hc]; omega
    · rw [Nat.succ_mul, hc]; omega

lemma count_frontLoaded (cap n m : ℕ) (hcap : 0 < cap) (hm : 1 ≤ m) :
    (frontLoaded cap n).count m = min n (cap * m) - min n (cap * (m - 1)) := by
  have hB : cap * m = cap * (m - 1) + cap := by
    have h : m - 1 + 1 = m := by omega
    calc cap * m = cap * (m - 1 + 1) := by rw [h]
      _ = cap * (m - 1) + cap := by ring
  induction n with
  | zero => simp [frontLoaded]
  | succ n ih =>
    have hstep : frontLoaded cap (n + 1) = frontLoaded cap n ++ [n / cap + 1] := by
      simp [frontLoaded, List.range_succ]
    have hdiv : (n / cap + 1 = m) ↔ (cap * (m - 1) ≤ n ∧ n < cap * (m - 1) + cap) := by
      rw [show (n / cap + 1 = m) ↔ (n / cap = m - 1) by omega]
      exact nat_div_eq_iff cap n (m - 1) hcap
    rw [hstep, List.count_append, ih]
    by_cases h : n / cap + 1 = m
    · have := hdiv.mp h
      simp only [List.count_singleton, h, beq_self_eq_true, if_pos]
      omega
    · have := hdiv.not.mp h
      push_neg at this
      rw [List.count_singleton, if_neg (by simpa using h)]
      omega

lemma prefix_frontLoaded (cap n k : ℕ) (hcap : 0 < cap) :
    ∑ i ∈ range k, (frontLoaded cap n).count (i + 1) = min n (cap * k) := by
  induction k with
  | zero => simp
  | succ k ih =>
    rw [Finset.sum_range_succ, ih, count_frontLoaded cap n (k + 1) hcap (by omega)]
    simp only [Nat.add_sub_cancel]
    have : cap * k ≤ cap * (k + 1) := by nlinarith
    omega

lemma frontLoaded_mem (cap n : ℕ) (hn : n ≤ 12 * cap) :
    ∀ m ∈ frontLoaded cap n, 1 ≤ m ∧ m ≤ 12 := by
  intro m hm
  simp only [frontLoaded, List.mem_map, List.mem_range] at hm
  obtain ⟨i, hi, rfl⟩ := hm
  refine ⟨by simp, ?_⟩
  have hcomm : cap * 12 = 12 * cap := Nat.mul_comm _ _
  have hlt : i / cap < 12 := by
    apply Nat.div_lt_of_lt_mul
    omega
  exact hlt

lemma frontLoaded_feasible (cap n : ℕ) (hcap : 0 < cap) (hn : n ≤ 12 * cap) :
    Feasible cap (frontLoaded cap n) := by
  refine ⟨frontLoaded_mem cap n hn, ?_⟩
  intro m
  rcases Nat.eq_zero_or_pos m with rfl | hm
  · have hzero : (frontLoaded cap n).count 0 = 0 := by
      rw [List.count_eq_zero]
      simp [frontLoaded]
    omega
  · rw [count_frontLoaded cap n m hcap hm]
    have h1 : cap * m = cap * (m - 1) + cap := by
      have : m - 1 + 1 = m := by omega
      calc cap * m = cap * (m - 1 + 1) := by rw [this]
        _ = cap * (m - 1) + cap := by ring
    omega

/-! ## Summation by parts -/

lemma abel_identity (F : ℕ → ℚ) (a : ℕ → ℕ) (N : ℕ) :
    ∑ i ∈ range N, (a i : ℚ) * F i
      = ∑ i ∈ range N, ((∑ j ∈ range (i + 1), a j : ℕ) : ℚ) * (F i - F (i + 1))
        + ((∑ j ∈ range N, a j : ℕ) : ℚ) * F N := by
  induction N with
  | zero => simp
  | succ N ih =>
    rw [Finset.sum_range_succ, ih, Finset.sum_range_succ (f := fun i =>
      ((∑ j ∈ range (i + 1), a j : ℕ) : ℚ) * (F i - F (i + 1)))]
    push_cast [Finset.sum_range_succ (f := a) (n := N)]
    ring

/-- **Front-loading is optimal.** Under a per-month cap, no schedule books more
in year one than the front-loaded schedule with the same number of hires. -/
theorem capacityOf_le_frontLoaded (f : ℕ → ℚ) (hanti : ∀ i, f (i + 1) ≤ f i)
    (cap : ℕ) (hcap : 0 < cap) (hs : List ℕ) (hfeas : Feasible cap hs) :
    capacityOf f hs ≤ capacityOf f (frontLoaded cap hs.length) := by
  set n := hs.length with hn
  have hncap : n ≤ 12 * cap := by
    have h := prefix_le_cap cap hs hfeas 12
    rw [sum_counts_length hs hfeas.months] at h
    have : cap * 12 = 12 * cap := Nat.mul_comm _ _
    omega
  rw [capacityOf_eq_sum_counts f hs hfeas.months,
    capacityOf_eq_sum_counts f (frontLoaded cap n) (frontLoaded_mem cap n hncap)]
  set F : ℕ → ℚ := fun i => f (i + 1) with hF
  set a : ℕ → ℕ := fun i => hs.count (i + 1) with ha
  set b : ℕ → ℕ := fun i => (frontLoaded cap n).count (i + 1) with hb
  show ∑ i ∈ range 12, (a i : ℚ) * F i ≤ ∑ i ∈ range 12, (b i : ℚ) * F i
  rw [abel_identity F a 12, abel_identity F b 12]
  have htot : ∑ j ∈ range 12, a j = ∑ j ∈ range 12, b j := by
    rw [sum_counts_length hs hfeas.months,
      sum_counts_length _ (frontLoaded_mem cap n hncap), length_frontLoaded]
  have hpre : ∀ i ∈ range 12, (∑ j ∈ range (i + 1), a j) ≤ ∑ j ∈ range (i + 1), b j := by
    intro i hi
    have hi12 : i + 1 ≤ 12 := by simpa using Finset.mem_range.mp hi
    rw [hb, prefix_frontLoaded cap n (i + 1) hcap]
    exact le_min (prefix_le_length hs hfeas.months hi12) (prefix_le_cap cap hs hfeas (i + 1))
  refine add_le_add (Finset.sum_le_sum fun i hi => ?_) (by rw [htot])
  have hd : 0 ≤ F i - F (i + 1) := by
    have := hanti (i + 1)
    simp only [hF]
    linarith
  exact mul_le_mul_of_nonneg_right (by exact_mod_cast hpre i hi) hd

/-! ## The solver's hire count -/

/-- The least `k` in `[cur, cur + fuel]` satisfying `P`, or `cur + fuel` if there
is none. -/
def leastUpTo (P : ℕ → Bool) : ℕ → ℕ → ℕ
  | 0, cur => cur
  | fuel + 1, cur => if P cur then cur else leastUpTo P fuel (cur + 1)

lemma leastUpTo_le (P : ℕ → Bool) (fuel cur : ℕ) : leastUpTo P fuel cur ≤ cur + fuel := by
  induction fuel generalizing cur with
  | zero => simp [leastUpTo]
  | succ fuel ih =>
    rw [leastUpTo]
    split
    · omega
    · have := ih (cur + 1); omega

lemma leastUpTo_min (P : ℕ → Bool) (fuel : ℕ) :
    ∀ (cur k : ℕ), cur ≤ k → k ≤ cur + fuel → P k → leastUpTo P fuel cur ≤ k := by
  induction fuel with
  | zero => intro cur k h1 _ _; simpa [leastUpTo] using h1
  | succ fuel ih =>
    intro cur k h1 h2 h3
    rw [leastUpTo]
    split
    · exact h1
    · rename_i hcur
      have hne : cur ≠ k := by rintro rfl; exact hcur h3
      exact ih (cur + 1) k (by omega) (by omega) h3

lemma leastUpTo_sat (P : ℕ → Bool) (fuel : ℕ) :
    ∀ (cur k : ℕ), cur ≤ k → k ≤ cur + fuel → P k → P (leastUpTo P fuel cur) := by
  induction fuel with
  | zero => intro cur k h1 h2 h3; have : cur = k := by omega
            simpa [leastUpTo, this] using h3
  | succ fuel ih =>
    intro cur k h1 h2 h3
    rw [leastUpTo]
    split
    · assumption
    · rename_i hcur
      have hne : cur ≠ k := by rintro rfl; exact hcur h3
      exact ih (cur + 1) k (by omega) (by omega) h3

/-- Fewest front-loaded hires that clear the remaining requirement `need`, or a
whole plan year's worth of hires if the requirement cannot be cleared. -/
def hireCount (f : ℕ → ℚ) (need : ℚ) (cap : ℕ) : ℕ :=
  leastUpTo (fun n => decide (need ≤ capacityOf f (frontLoaded cap n))) (12 * cap) 0

lemma hireCount_le (f : ℕ → ℚ) (need : ℚ) (cap : ℕ) : hireCount f need cap ≤ 12 * cap := by
  simpa using leastUpTo_le _ (12 * cap) 0

/-- If some feasible schedule clears the requirement, the solver's schedule does. -/
theorem hireCount_clears (f : ℕ → ℚ) (hanti : ∀ i, f (i + 1) ≤ f i)
    (need : ℚ) (cap : ℕ) (hcap : 0 < cap) (hs : List ℕ) (hfeas : Feasible cap hs)
    (hclear : need ≤ capacityOf f hs) :
    need ≤ capacityOf f (frontLoaded cap (hireCount f need cap)) := by
  have hncap : hs.length ≤ 12 * cap := by
    have h := prefix_le_cap cap hs hfeas 12
    rw [sum_counts_length hs hfeas.months] at h
    have : cap * 12 = 12 * cap := Nat.mul_comm _ _
    omega
  have hfront : need ≤ capacityOf f (frontLoaded cap hs.length) :=
    hclear.trans (capacityOf_le_frontLoaded f hanti cap hcap hs hfeas)
  have := leastUpTo_sat (fun n => decide (need ≤ capacityOf f (frontLoaded cap n)))
    (12 * cap) 0 hs.length (by omega) (by omega) (by simpa using hfront)
  simpa [hireCount] using this

/-- **The hire count is minimal.** No feasible schedule with fewer hires than the
solver's clears the requirement. -/
theorem hireCount_minimal (f : ℕ → ℚ) (hanti : ∀ i, f (i + 1) ≤ f i)
    (need : ℚ) (cap : ℕ) (hcap : 0 < cap) (hs : List ℕ) (hfeas : Feasible cap hs)
    (hclear : need ≤ capacityOf f hs) :
    hireCount f need cap ≤ hs.length := by
  have hncap : hs.length ≤ 12 * cap := by
    have h := prefix_le_cap cap hs hfeas 12
    rw [sum_counts_length hs hfeas.months] at h
    have : cap * 12 = 12 * cap := Nat.mul_comm _ _
    omega
  have hfront : need ≤ capacityOf f (frontLoaded cap hs.length) :=
    hclear.trans (capacityOf_le_frontLoaded f hanti cap hcap hs hfeas)
  have := leastUpTo_min (fun n => decide (need ≤ capacityOf f (frontLoaded cap n)))
    (12 * cap) 0 hs.length (by omega) (by omega) (by simpa using hfront)
  simpa [hireCount] using this

end NineEngines.Hiring
