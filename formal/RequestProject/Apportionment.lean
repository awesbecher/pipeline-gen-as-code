import Mathlib

/-!
# Largest-remainder apportionment

This file formalises the `apportion` helper used by the budget split of the
`pipeline-gen-as-code` mix engine (`engine/mix.cjs`).

The JavaScript version computes, for a pool of basis points `pool` and a list of
weights `ws`,

* the exact share `pool * wᵢ / W` (with `W = Σ wⱼ`),
* the floor of each exact share,
* and then hands one extra unit to the `pool - Σ floors` entries with the largest
  fractional remainder, ties broken by original position (the JS sort is stable).

Because every exact share is rational with denominator `W`, its floor is exactly
natural-number division and its fractional part is ordered exactly as the natural
remainder `pool * wᵢ % W`, so the model below is an exact, float-free rendering
of that algorithm.

Main results:

* `NineEngines.Apportion.sum_shares` : the shares add up to the pool exactly
  ("cash always reconciles to the dollar");
* `NineEngines.Apportion.shares_eq_floor_or_succ` : every share is its exact
  share rounded down or up, never further away.
-/

namespace NineEngines.Apportion

open List

/-- The pairs `(weight, index)` sorted by fractional remainder, descending.
Insertion sort is stable, matching the stable `Array.prototype.sort` used by the
reference implementation. -/
def bumpOrder (pool : ℕ) (ws : List ℕ) : List (ℕ × ℕ) :=
  List.insertionSort (fun a b => pool * b.1 % ws.sum ≤ pool * a.1 % ws.sum) ws.zipIdx

/-- Number of entries that receive one extra unit. -/
def bumpCount (pool : ℕ) (ws : List ℕ) : ℕ :=
  pool - (ws.map (fun w => pool * w / ws.sum)).sum

/-- Indices of the entries that receive one extra unit. -/
def bumped (pool : ℕ) (ws : List ℕ) : List ℕ :=
  ((bumpOrder pool ws).take (bumpCount pool ws)).map Prod.snd

/-- Largest-remainder apportionment of `pool` across the weights `ws`,
returned in the original order. -/
def shares (pool : ℕ) (ws : List ℕ) : List ℕ :=
  if ws.sum = 0 then ws.map (fun _ => 0)
  else ws.zipIdx.map (fun p => pool * p.1 / ws.sum + if p.2 ∈ bumped pool ws then 1 else 0)

@[simp] lemma length_shares (pool : ℕ) (ws : List ℕ) : (shares pool ws).length = ws.length := by
  unfold shares; split <;> simp

lemma map_snd_zipIdx (l : List ℕ) : l.zipIdx.map Prod.snd = List.range l.length := by
  simp [List.range_eq_range']

lemma mul_sum_map (pool : ℕ) (ws : List ℕ) : pool * ws.sum = (ws.map (fun w => pool * w)).sum := by
  induction ws with
  | nil => simp
  | cons a l ih => simp [Nat.mul_add, ih]

/-- Euclidean division, summed over the weights. -/
lemma sum_div_mod (pool W : ℕ) (ws : List ℕ) :
    W * (ws.map (fun w => pool * w / W)).sum + (ws.map (fun w => pool * w % W)).sum
      = pool * ws.sum := by
  induction ws with
  | nil => simp
  | cons a l ih =>
    simp only [List.map_cons, List.sum_cons, Nat.mul_add]
    have := Nat.div_add_mod (pool * a) W
    omega

/-- The floors never overspend the pool. -/
lemma sum_floors_le (pool : ℕ) (ws : List ℕ) (hW : ws.sum ≠ 0) :
    (ws.map (fun w => pool * w / ws.sum)).sum ≤ pool := by
  have hWpos : 0 < ws.sum := Nat.pos_of_ne_zero hW
  have h := sum_div_mod pool ws.sum ws
  have hle : ws.sum * (ws.map (fun w => pool * w / ws.sum)).sum ≤ pool * ws.sum := by omega
  exact Nat.le_of_mul_le_mul_left (by rwa [Nat.mul_comm pool ws.sum] at hle) hWpos

lemma sum_map_const (ws : List ℕ) (c : ℕ) : (ws.map (fun _ => c)).sum = ws.length * c := by
  induction ws with
  | nil => simp
  | cons a t ih => simp; ring

/-- Each remainder is smaller than the total weight, so their sum is bounded. -/
lemma sum_rem_lt (pool : ℕ) (ws : List ℕ) (hW : ws.sum ≠ 0) :
    (ws.map (fun w => pool * w % ws.sum)).sum ≤ ws.length * (ws.sum - 1) := by
  have hWpos : 0 < ws.sum := Nat.pos_of_ne_zero hW
  have hle : (ws.map (fun w => pool * w % ws.sum)).sum ≤ (ws.map (fun _ => ws.sum - 1)).sum := by
    apply List.sum_le_sum
    intro w _
    have := Nat.mod_lt (pool * w) hWpos
    omega
  rwa [sum_map_const] at hle

/-- The number of bumped entries never exceeds the number of entries. -/
lemma bumpCount_le_length (pool : ℕ) (ws : List ℕ) (hW : ws.sum ≠ 0) :
    bumpCount pool ws ≤ ws.length := by
  have hWpos : 0 < ws.sum := Nat.pos_of_ne_zero hW
  have h := sum_div_mod pool ws.sum ws
  have hb := sum_rem_lt pool ws hW
  have hfl := sum_floors_le pool ws hW
  -- `ws.sum * bumpCount = Σ remainders ≤ length * (ws.sum - 1) < length * ws.sum`
  have hkey : ws.sum * bumpCount pool ws = (ws.map (fun w => pool * w % ws.sum)).sum := by
    unfold bumpCount
    rw [Nat.mul_sub]
    have hc : pool * ws.sum = ws.sum * pool := Nat.mul_comm _ _
    omega
  have hlpos : 0 < ws.length := by
    rcases ws with _ | ⟨a, l⟩
    · simp at hW
    · simp
  have h1 : ws.length * (ws.sum - 1) = ws.length * ws.sum - ws.length := by
    rw [Nat.mul_sub]; simp
  have h2 : ws.length ≤ ws.length * ws.sum := Nat.le_mul_of_pos_right _ hWpos
  by_contra hcon
  push_neg at hcon
  have h3 : ws.sum * ws.length ≤ ws.sum * bumpCount pool ws :=
    Nat.mul_le_mul_left _ (le_of_lt hcon)
  have h4 : ws.sum * ws.length = ws.length * ws.sum := Nat.mul_comm _ _
  omega

lemma length_bumpOrder (pool : ℕ) (ws : List ℕ) : (bumpOrder pool ws).length = ws.length := by
  unfold bumpOrder
  rw [(List.perm_insertionSort _ _).length_eq]
  simp

lemma bumpOrder_snd_perm (pool : ℕ) (ws : List ℕ) :
    ((bumpOrder pool ws).map Prod.snd).Perm (List.range ws.length) := by
  unfold bumpOrder
  have := ((List.perm_insertionSort
    (fun a b => pool * b.1 % ws.sum ≤ pool * a.1 % ws.sum) ws.zipIdx)).map Prod.snd
  rw [map_snd_zipIdx] at this
  exact this

lemma bumped_nodup (pool : ℕ) (ws : List ℕ) : (bumped pool ws).Nodup := by
  have hp := bumpOrder_snd_perm pool ws
  have hnd : ((bumpOrder pool ws).map Prod.snd).Nodup := hp.nodup_iff.mpr (List.nodup_range)
  have hsub : (bumped pool ws).Sublist ((bumpOrder pool ws).map Prod.snd) :=
    (List.take_sublist _ _).map Prod.snd
  exact hsub.nodup hnd

lemma bumped_subset (pool : ℕ) (ws : List ℕ) :
    ∀ i ∈ bumped pool ws, i ∈ List.range ws.length := by
  intro i hi
  have hsub : (bumped pool ws).Sublist ((bumpOrder pool ws).map Prod.snd) :=
    (List.take_sublist _ _).map Prod.snd
  exact (bumpOrder_snd_perm pool ws).mem_iff.mp (hsub.mem hi)

lemma length_bumped (pool : ℕ) (ws : List ℕ) (hW : ws.sum ≠ 0) :
    (bumped pool ws).length = bumpCount pool ws := by
  unfold bumped
  rw [List.length_map, List.length_take, length_bumpOrder]
  exact Nat.min_eq_left (bumpCount_le_length pool ws hW)

lemma sum_map_ite (l : List ℕ) (p : ℕ → Prop) [DecidablePred p] :
    (l.map (fun i => if p i then 1 else 0)).sum = l.countP (fun i => decide (p i)) := by
  induction l with
  | nil => simp
  | cons a t ih =>
    by_cases h : p a <;> simp [h, ih, Nat.add_comm]

/-- Counting a nodup sublist of `range n` inside `range n`. -/
lemma countP_mem_eq_length (n : ℕ) (B : List ℕ) (hnd : B.Nodup)
    (hsub : ∀ i ∈ B, i ∈ List.range n) :
    (List.range n).countP (fun i => decide (i ∈ B)) = B.length := by
  rw [List.countP_eq_length_filter]
  have hperm : ((List.range n).filter (fun i => decide (i ∈ B))).Perm B := by
    refine (List.perm_ext_iff_of_nodup ?_ hnd).mpr ?_
    · exact (List.filter_sublist).nodup (List.nodup_range)
    · intro a
      simp only [List.mem_filter, decide_eq_true_eq]
      exact ⟨fun h => h.2, fun h => ⟨hsub a h, h⟩⟩
  exact hperm.length_eq

/-- **Exact reconciliation.** The largest-remainder shares sum to the pool. -/
theorem sum_shares (pool : ℕ) (ws : List ℕ) (hW : ws.sum ≠ 0) :
    (shares pool ws).sum = pool := by
  have hfl := sum_floors_le pool ws hW
  unfold shares
  rw [if_neg hW]
  have hsplit : (ws.zipIdx.map
      (fun p => pool * p.1 / ws.sum + if p.2 ∈ bumped pool ws then 1 else 0)).sum
      = (ws.zipIdx.map (fun p => pool * p.1 / ws.sum)).sum
        + (ws.zipIdx.map (fun p => if p.2 ∈ bumped pool ws then 1 else 0)).sum := by
    induction ws.zipIdx with
    | nil => simp
    | cons a t ih => simp only [List.map_cons, List.sum_cons, ih]; omega
  rw [hsplit]
  have h1 : (ws.zipIdx.map (fun p => pool * p.1 / ws.sum)).sum
      = (ws.map (fun w => pool * w / ws.sum)).sum := by
    rw [show (fun (p : ℕ × ℕ) => pool * p.1 / ws.sum)
          = (fun w => pool * w / ws.sum) ∘ Prod.fst from rfl, ← List.map_map]
    simp
  have h2 : (ws.zipIdx.map (fun p => if p.2 ∈ bumped pool ws then 1 else 0)).sum
      = (bumped pool ws).length := by
    rw [show (fun (p : ℕ × ℕ) => if p.2 ∈ bumped pool ws then 1 else 0)
          = (fun i => if i ∈ bumped pool ws then 1 else 0) ∘ Prod.snd from rfl, ← List.map_map,
        map_snd_zipIdx, sum_map_ite]
    exact countP_mem_eq_length _ _ (bumped_nodup pool ws) (bumped_subset pool ws)
  rw [h1, h2, length_bumped pool ws hW]
  unfold bumpCount
  omega

/-- The shares never overspend the pool, whatever the weights. -/
theorem sum_shares_le (pool : ℕ) (ws : List ℕ) : (shares pool ws).sum ≤ pool := by
  by_cases h : ws.sum = 0
  · unfold shares; rw [if_pos h]; simp
  · exact le_of_eq (sum_shares pool ws h)

/-- Every share is the exact share rounded down, or that plus one. -/
theorem shares_eq_floor_or_succ (pool : ℕ) (ws : List ℕ) (hW : ws.sum ≠ 0)
    (w i : ℕ) (h : (w, i) ∈ ws.zipIdx) :
    (shares pool ws).getD i 0 = pool * w / ws.sum ∨
      (shares pool ws).getD i 0 = pool * w / ws.sum + 1 := by
  have hidx : ws.zipIdx[i]? = some (w, i) := by
    obtain ⟨h0, h1, h2⟩ := List.mem_zipIdx h
    rw [List.getElem?_zipIdx]
    simp only [Nat.zero_add, Nat.sub_zero] at h1 h2
    rw [List.getElem?_eq_getElem h1]
    simp [h2]
  unfold shares
  rw [if_neg hW]
  have : (ws.zipIdx.map (fun p => pool * p.1 / ws.sum
      + if p.2 ∈ bumped pool ws then 1 else 0)).getD i 0
      = pool * w / ws.sum + if i ∈ bumped pool ws then 1 else 0 := by
    rw [List.getD_eq_getElem?_getD, List.getElem?_map, hidx]
    simp
  rw [this]
  by_cases hb : i ∈ bumped pool ws
  · right; simp [hb]
  · left; simp [hb]

end NineEngines.Apportion
