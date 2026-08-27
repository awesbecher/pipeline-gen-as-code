import RequestProject.Apportionment

/-!
# The mix engine: engine verdicts and the budget split

A formal model of `engine/mix.cjs` from `pipeline-gen-as-code`.

Given a company's parameters the mix engine returns, for each of the nine
pipeline engines, a verdict (`run_now`, `instrument_now`, `defer`, `blocked`)
with a weight, and then splits the monthly pipeline budget in basis points:
the `run_now` engines share 8500 bps by weight, the `instrument_now` engines
split 1500 bps equally, by largest-remainder apportionment.

Finally a fixed-point loop enforces *spend floors*: a funded `paid_media`
below \$8,000 a month, or a funded `events` below \$15,000 a month, is deferred
and the split recomputed without it.

Modelling notes.

* `engines_running` is omitted: the reference implementation annotates
  verdicts with it but explicitly does not let it change them.
* Reason strings and labels are omitted; they carry no arithmetic.
* All money is in whole dollars and all shares in whole basis points, which is
  what the reference implementation's `Math.floor` calls produce.

Main results:

* `NineEngines.Mix.totalBps_eq` — the pools are split exactly: 8500 bps go out
  when some engine runs, 1500 bps when some engine instruments, nothing more.
* `NineEngines.Mix.allocated_le_cash` and `NineEngines.Mix.allocated_add_unallocated`
  — allocated and unallocated dollars reconcile to the budget exactly.
* `NineEngines.Mix.bps_eq_zero_of_not_funded` — deferred and blocked engines get
  no money.
* `NineEngines.Mix.constraint_*` — every hard constraint really does switch its
  engine off.
* `NineEngines.Mix.spend_floor_respected` — the floor loop always terminates in a
  state where every funded engine with a spend floor is funded at or above it.
-/

namespace NineEngines.Mix

open NineEngines

/-- The nine pipeline engines. -/
inductive Engine where
  | automatedOutbound | plg | manualOutbound | abm | communityPartner
  | paidMedia | seoAeo | socialContent | events
  deriving DecidableEq, Repr

/-- The engines in the order used by the reference implementation. The order is
observable: it breaks ties in the stable sort of the apportionment. -/
def allEngines : List Engine :=
  [.automatedOutbound, .plg, .manualOutbound, .abm, .communityPartner,
   .paidMedia, .seoAeo, .socialContent, .events]

/-- Verdicts the mix engine can return. -/
inductive Verdict where
  | runNow | instrumentNow | defer | blocked
  deriving DecidableEq, Repr

/-- The hard-constraint vocabulary of the params schema. -/
inductive Constraint where
  | noEmail | noPhone | noPaidBudget | noEventsBudget | noCommunityCapacity | founderWontPost
  deriving DecidableEq, Repr

/-- Whether the product has a self-serve surface. -/
inductive SelfServe where
  | noSelfServe | partialSelfServe | fullSelfServe
  deriving DecidableEq, Repr

/-- The portfolio drivers of the intake schema. -/
structure Params where
  acv : ℕ
  cashMonthlyPipeline : ℕ
  aesRamped : ℕ
  aesRamping : ℕ
  gtmEngineer : Bool
  constraints : List Constraint
  selfServe : SelfServe
  developerFacing : Bool
  deriving Repr

/-- A verdict together with its apportionment weight. -/
abbrev Call := Verdict × ℕ

namespace Params

def aes (p : Params) : ℕ := p.aesRamped + p.aesRamping

def has (p : Params) (c : Constraint) : Bool := c ∈ p.constraints

def enterprise (p : Params) : Bool := 75000 ≤ p.acv

end Params

open Params

/-- 01 Automated Outbound. -/
def callAutomatedOutbound (p : Params) : Call :=
  if p.has .noEmail then (.blocked, 0)
  else if !p.gtmEngineer && p.aes = 0 then (.defer, 0)
  else (.runNow, 2)

/-- 02 Product-Led Growth. -/
def callPlg (p : Params) : Call :=
  match p.selfServe with
  | .noSelfServe => (.defer, 0)
  | .fullSelfServe => if p.acv < 50000 then (.runNow, 3) else (.instrumentNow, 1)
  | .partialSelfServe => (.instrumentNow, 1)

/-- 03 Manual Outbound + Cold Calling. -/
def callManualOutbound (p : Params) : Call :=
  if p.has .noPhone && p.has .noEmail then (.defer, 0)
  else if p.has .noPhone then (if 50000 ≤ p.acv then (.instrumentNow, 1) else (.defer, 0))
  else if p.has .noEmail then (if 25000 ≤ p.acv then (.runNow, 3) else (.defer, 0))
  else if p.acv < 25000 then (.defer, 0)
  else (.runNow, 3)

/-- 04 ABM. -/
def callAbm (p : Params) : Call :=
  if p.enterprise then (if 1 ≤ p.aes then (.runNow, 2) else (.instrumentNow, 1))
  else (.defer, 0)

/-- 05 Community + Partner Led. -/
def callCommunityPartner (p : Params) : Call :=
  if p.has .noCommunityCapacity then (.defer, 0) else (.instrumentNow, 1)

/-- 06 Paid Media. -/
def callPaidMedia (p : Params) : Call :=
  if p.has .noPaidBudget then (.defer, 0)
  else if p.cashMonthlyPipeline < 8000 then (.defer, 0)
  else match (callAbm p).1 with
    | .runNow => (.runNow, 1)
    | _ => (.defer, 0)

/-- 07 SEO + AEO. Always instrumented. -/
def callSeoAeo (_p : Params) : Call := (.instrumentNow, 1)

/-- 08 Social Content. -/
def callSocialContent (p : Params) : Call :=
  if p.has .founderWontPost then (.defer, 0) else (.runNow, 1)

/-- 09 Events. -/
def callEvents (p : Params) : Call :=
  if p.has .noEventsBudget then (.blocked, 0)
  else if p.enterprise && 15000 ≤ p.cashMonthlyPipeline then (.runNow, 2)
  else (.defer, 0)

/-- The verdict table before the spend-floor loop. -/
def baseCall (p : Params) : Engine → Call
  | .automatedOutbound => callAutomatedOutbound p
  | .plg => callPlg p
  | .manualOutbound => callManualOutbound p
  | .abm => callAbm p
  | .communityPartner => callCommunityPartner p
  | .paidMedia => callPaidMedia p
  | .seoAeo => callSeoAeo p
  | .socialContent => callSocialContent p
  | .events => callEvents p

/-! ## The budget split -/

/-- Engines whose verdict is `run_now`, in canonical order. -/
def runList (st : Engine → Call) : List Engine :=
  allEngines.filter (fun e => (st e).1 = Verdict.runNow)

/-- Engines whose verdict is `instrument_now`, in canonical order. -/
def instList (st : Engine → Call) : List Engine :=
  allEngines.filter (fun e => (st e).1 = Verdict.instrumentNow)

/-- The run pool: 8500 basis points, apportioned by weight. -/
def runShares (st : Engine → Call) : List (Engine × ℕ) :=
  (runList st).zip (Apportion.shares 8500 ((runList st).map (fun e => (st e).2)))

/-- The instrument pool: 1500 basis points, split equally. -/
def instShares (st : Engine → Call) : List (Engine × ℕ) :=
  (instList st).zip (Apportion.shares 1500 ((instList st).map (fun _ => 1)))

/-- The whole basis-point allocation. -/
def allocation (st : Engine → Call) : List (Engine × ℕ) := runShares st ++ instShares st

/-- Look a share up in an allocation; engines that are not funded get zero. -/
def lookupBps (l : List (Engine × ℕ)) (e : Engine) : ℕ :=
  match l.find? (fun q => q.1 = e) with
  | some q => q.2
  | none => 0

/-- Basis points allocated to an engine. -/
def bps (st : Engine → Call) (e : Engine) : ℕ := lookupBps (allocation st) e

/-- Dollars a month allocated to an engine. -/
def monthly (cash : ℕ) (st : Engine → Call) (e : Engine) : ℕ := cash * bps st e / 10000

/-- Total basis points handed out. -/
def totalBps (st : Engine → Call) : ℕ := ((allocation st).map Prod.snd).sum

/-- Total dollars a month handed out. -/
def allocated (cash : ℕ) (st : Engine → Call) : ℕ :=
  ((allocation st).map (fun q => cash * q.2 / 10000)).sum

/-- Budget left unallocated. -/
def unallocated (cash : ℕ) (st : Engine → Call) : ℕ := cash - allocated cash st

/-! ## Spend floors -/

/-- Minimum monthly dollars an engine needs to be worth funding at all;
`0` means the engine has no floor. -/
def floorOf : Engine → ℕ
  | .paidMedia => 8000
  | .events => 15000
  | _ => 0

/-- Funded engines that fall below their own spend floor. -/
def violators (cash : ℕ) (st : Engine → Call) : List Engine :=
  allEngines.filter (fun e =>
    (st e).1 = Verdict.runNow ∧ 0 < floorOf e ∧ monthly cash st e < floorOf e)

/-- Keep whichever of the two engines is funded at the smaller fraction of its
floor; on a tie the incumbent (scanned earlier) wins, as in the reference
implementation's strict `ratio < worstRatio` test. -/
def worseStep (cash : ℕ) (st : Engine → Call) (acc : Option Engine) (e : Engine) : Option Engine :=
  match acc with
  | none => some e
  | some b =>
    if monthly cash st e * floorOf b < monthly cash st b * floorOf e then some e else some b

/-- The violator with the smallest funded-to-floor ratio, first one winning ties,
exactly as the reference implementation scans. -/
def worstViolator (cash : ℕ) (st : Engine → Call) : Option Engine :=
  (violators cash st).foldl (worseStep cash st) none

/-- The floor loop, run with a fuel bound as in the reference implementation. -/
def floorLoop (cash : ℕ) : ℕ → (Engine → Call) → (Engine → Call)
  | 0, st => st
  | n + 1, st =>
    match worstViolator cash st with
    | none => st
    | some e => floorLoop cash n (Function.update st e (Verdict.defer, 0))

/-- The verdict table the mix engine returns. -/
def finalCall (p : Params) : Engine → Call :=
  floorLoop p.cashMonthlyPipeline 10 (baseCall p)

/-- The full result of the mix engine on a set of parameters. -/
structure MixResult where
  verdict : Engine → Call
  bpsOf : Engine → ℕ
  monthlyOf : Engine → ℕ
  allocatedTotal : ℕ
  unallocatedTotal : ℕ

/-- Run the mix engine. -/
def recommend (p : Params) : MixResult :=
  let st := finalCall p
  { verdict := st
    bpsOf := bps st
    monthlyOf := monthly p.cashMonthlyPipeline st
    allocatedTotal := allocated p.cashMonthlyPipeline st
    unallocatedTotal := unallocated p.cashMonthlyPipeline st }

/-! ## Invariants of the split -/

lemma mem_allEngines (e : Engine) : e ∈ allEngines := by cases e <;> decide

lemma mem_runList_iff (st : Engine → Call) (e : Engine) :
    e ∈ runList st ↔ (st e).1 = Verdict.runNow := by
  simp [runList, List.mem_filter, mem_allEngines e]

lemma mem_instList_iff (st : Engine → Call) (e : Engine) :
    e ∈ instList st ↔ (st e).1 = Verdict.instrumentNow := by
  simp [instList, List.mem_filter, mem_allEngines e]

lemma runShares_snd (st : Engine → Call) :
    (runShares st).map Prod.snd
      = Apportion.shares 8500 ((runList st).map (fun e => (st e).2)) := by
  apply List.map_snd_zip
  simp

lemma instShares_snd (st : Engine → Call) :
    (instShares st).map Prod.snd
      = Apportion.shares 1500 ((instList st).map (fun _ => 1)) := by
  apply List.map_snd_zip
  simp

/-- The run pool is handed out in full whenever some engine runs with a positive
weight. -/
theorem runBps_total (st : Engine → Call)
    (h : ((runList st).map (fun e => (st e).2)).sum ≠ 0) :
    ((runShares st).map Prod.snd).sum = 8500 := by
  rw [runShares_snd]
  exact Apportion.sum_shares _ _ h

lemma sum_map_one (l : List Engine) : (l.map (fun _ => (1 : ℕ))).sum = l.length := by
  induction l with
  | nil => simp
  | cons a t ih => simp [Nat.add_comm]

/-- The instrument pool is handed out in full whenever some engine instruments. -/
theorem instBps_total (st : Engine → Call) (h : instList st ≠ []) :
    ((instShares st).map Prod.snd).sum = 1500 := by
  rw [instShares_snd]
  refine Apportion.sum_shares _ _ ?_
  rw [sum_map_one]
  simpa using h

/-- Never more than the whole budget is apportioned. -/
theorem totalBps_le (st : Engine → Call) : totalBps st ≤ 10000 := by
  unfold totalBps allocation
  rw [List.map_append, List.sum_append, runShares_snd, instShares_snd]
  have h1 := Apportion.sum_shares_le 8500 ((runList st).map (fun e => (st e).2))
  have h2 := Apportion.sum_shares_le 1500 ((instList st).map (fun _ => 1))
  omega

/-- The whole budget is apportioned exactly when both pools have a taker. -/
theorem totalBps_eq (st : Engine → Call)
    (h1 : ((runList st).map (fun e => (st e).2)).sum ≠ 0) (h2 : instList st ≠ []) :
    totalBps st = 10000 := by
  unfold totalBps allocation
  rw [List.map_append, List.sum_append, runBps_total st h1, instBps_total st h2]

lemma sum_floor_div_le (cash : ℕ) (l : List (Engine × ℕ)) :
    (l.map (fun q => cash * q.2 / 10000)).sum ≤ cash * ((l.map Prod.snd).sum) / 10000 := by
  induction l with
  | nil => simp
  | cons a t ih =>
    simp only [List.map_cons, List.sum_cons]
    have hmul : cash * (a.2 + (t.map Prod.snd).sum) = cash * a.2 + cash * (t.map Prod.snd).sum :=
      Nat.mul_add _ _ _
    omega

/-- **Reconciliation, part one.** The split never allocates more than the budget. -/
theorem allocated_le_cash (cash : ℕ) (st : Engine → Call) : allocated cash st ≤ cash := by
  refine (sum_floor_div_le cash (allocation st)).trans ?_
  have h : cash * totalBps st ≤ cash * 10000 := Nat.mul_le_mul_left _ (totalBps_le st)
  calc cash * ((allocation st).map Prod.snd).sum / 10000 ≤ cash * 10000 / 10000 :=
        Nat.div_le_div_right h
    _ = cash := by simp

/-- **Reconciliation, part two.** Allocated and unallocated dollars add back up to
the monthly pipeline budget, to the dollar. -/
theorem allocated_add_unallocated (cash : ℕ) (st : Engine → Call) :
    allocated cash st + unallocated cash st = cash := by
  have := allocated_le_cash cash st
  unfold unallocated
  omega

lemma lookupBps_eq_zero (l : List (Engine × ℕ)) (e : Engine) (h : ∀ q ∈ l, q.1 ≠ e) :
    lookupBps l e = 0 := by
  unfold lookupBps
  have : l.find? (fun q => q.1 = e) = none :=
    List.find?_eq_none.mpr (by intro q hq; simpa using h q hq)
  rw [this]

/-- **No money without a verdict.** Engines that are deferred or blocked receive
no basis points, hence no dollars. -/
theorem bps_eq_zero_of_not_funded (st : Engine → Call) (e : Engine)
    (h1 : (st e).1 ≠ Verdict.runNow) (h2 : (st e).1 ≠ Verdict.instrumentNow) :
    bps st e = 0 := by
  unfold bps
  refine lookupBps_eq_zero _ _ ?_
  intro q hq
  rcases List.mem_append.mp hq with hq | hq
  · have : q.1 ∈ runList st := (List.of_mem_zip (by simpa using hq)).1
    intro hne
    exact h1 (hne ▸ (mem_runList_iff st q.1).mp this)
  · have : q.1 ∈ instList st := (List.of_mem_zip (by simpa using hq)).1
    intro hne
    exact h2 (hne ▸ (mem_instList_iff st q.1).mp this)

theorem monthly_eq_zero_of_not_funded (cash : ℕ) (st : Engine → Call) (e : Engine)
    (h1 : (st e).1 ≠ Verdict.runNow) (h2 : (st e).1 ≠ Verdict.instrumentNow) :
    monthly cash st e = 0 := by
  simp [monthly, bps_eq_zero_of_not_funded st e h1 h2]

/-! ## The spend-floor loop -/

lemma floorLoop_succ_none (cash n : ℕ) (st : Engine → Call) (hw : worstViolator cash st = none) :
    floorLoop cash (n + 1) st = st := by
  simp [floorLoop, hw]

lemma floorLoop_succ_some (cash n : ℕ) (st : Engine → Call) (a : Engine)
    (hw : worstViolator cash st = some a) :
    floorLoop cash (n + 1) st = floorLoop cash n (Function.update st a (Verdict.defer, 0)) := by
  simp [floorLoop, hw]

lemma mem_violators_iff (cash : ℕ) (st : Engine → Call) (e : Engine) :
    e ∈ violators cash st ↔
      ((st e).1 = Verdict.runNow ∧ 0 < floorOf e ∧ monthly cash st e < floorOf e) := by
  simp [violators, List.mem_filter, mem_allEngines e]

lemma floorOf_pos_cases {e : Engine} (h : 0 < floorOf e) : e = .paidMedia ∨ e = .events := by
  cases e <;> simp_all [floorOf]

lemma worseStep_result (cash : ℕ) (st : Engine → Call) (acc : Option Engine) (a x : Engine)
    (h : worseStep cash st acc a = some x) : x = a ∨ acc = some x := by
  cases acc with
  | none => left; simp only [worseStep] at h; simpa [eq_comm] using h
  | some b =>
    simp only [worseStep] at h
    by_cases hlt : monthly cash st a * floorOf b < monthly cash st b * floorOf a
    · left; rw [if_pos hlt] at h; exact (Option.some_inj.mp h).symm
    · right; rw [if_neg hlt] at h; exact h

lemma foldl_worseStep_mem (cash : ℕ) (st : Engine → Call) :
    ∀ (l : List Engine) (acc : Option Engine) (x : Engine),
      l.foldl (worseStep cash st) acc = some x → x ∈ l ∨ acc = some x := by
  intro l
  induction l with
  | nil => intro acc x h; right; exact h
  | cons a t ih =>
    intro acc x h
    rw [List.foldl_cons] at h
    rcases ih _ x h with h' | h'
    · exact Or.inl (List.mem_cons_of_mem _ h')
    · rcases worseStep_result cash st acc a x h' with h'' | h''
      · exact Or.inl (by simp [h''])
      · exact Or.inr h''

lemma foldl_worseStep_some (cash : ℕ) (st : Engine → Call) :
    ∀ (l : List Engine) (b : Engine), ∃ x, l.foldl (worseStep cash st) (some b) = some x := by
  intro l
  induction l with
  | nil => intro b; exact ⟨b, rfl⟩
  | cons a t ih =>
    intro b
    rw [List.foldl_cons]
    unfold worseStep
    by_cases hlt : monthly cash st a * floorOf b < monthly cash st b * floorOf a
    · simpa [hlt] using ih a
    · simpa [hlt] using ih b

lemma worstViolator_mem {cash : ℕ} {st : Engine → Call} {e : Engine}
    (h : worstViolator cash st = some e) : e ∈ violators cash st := by
  rcases foldl_worseStep_mem cash st (violators cash st) none e h with h' | h'
  · exact h'
  · exact absurd h' (by simp)

lemma violators_eq_nil_of_worstViolator_none {cash : ℕ} {st : Engine → Call}
    (h : worstViolator cash st = none) : violators cash st = [] := by
  unfold worstViolator at h
  cases hv : violators cash st with
  | nil => rfl
  | cons a t =>
    rw [hv, List.foldl_cons] at h
    have : worseStep cash st none a = some a := rfl
    rw [this] at h
    obtain ⟨x, hx⟩ := foldl_worseStep_some cash st t a
    rw [hx] at h
    exact absurd h (by simp)

/-- How many floor-bearing engines are currently funded. At most two. -/
def floorMeasure (st : Engine → Call) : ℕ :=
  (if (st Engine.paidMedia).1 = Verdict.runNow then 1 else 0)
    + (if (st Engine.events).1 = Verdict.runNow then 1 else 0)

lemma floorMeasure_le_two (st : Engine → Call) : floorMeasure st ≤ 2 := by
  unfold floorMeasure; split_ifs <;> omega

lemma floorMeasure_update_lt {cash : ℕ} {st : Engine → Call} {e : Engine}
    (h : e ∈ violators cash st) :
    floorMeasure (Function.update st e (Verdict.defer, 0)) < floorMeasure st := by
  obtain ⟨hrun, hpos, -⟩ := (mem_violators_iff cash st e).mp h
  rcases floorOf_pos_cases hpos with rfl | rfl <;> simp [floorMeasure, hrun]

/-- The floor loop always reaches a state with no funded engine below its floor,
as long as it is given at least as much fuel as there are funded floor engines. -/
lemma violators_floorLoop (cash : ℕ) :
    ∀ (n : ℕ) (st : Engine → Call), floorMeasure st ≤ n →
      violators cash (floorLoop cash n st) = [] := by
  intro n
  induction n with
  | zero =>
    intro st hm
    cases hv : violators cash st with
    | nil => simpa [floorLoop] using hv
    | cons a t =>
      exfalso
      have ha : a ∈ violators cash st := by rw [hv]; exact List.mem_cons_self
      obtain ⟨hrun, hpos, -⟩ := (mem_violators_iff cash st a).mp ha
      rcases floorOf_pos_cases hpos with rfl | rfl <;> simp [floorMeasure, hrun] at hm
  | succ n ih =>
    intro st hm
    cases hw : worstViolator cash st with
    | none =>
      rw [floorLoop_succ_none cash n st hw]
      exact violators_eq_nil_of_worstViolator_none hw
    | some e =>
      rw [floorLoop_succ_some cash n st e hw]
      have hmem := worstViolator_mem hw
      have hlt := floorMeasure_update_lt hmem
      exact ih _ (by omega)

/-- **Spend floors are respected.** In the verdict table the mix engine returns,
any engine that is funded and carries a spend floor is funded at or above that
floor. -/
theorem spend_floor_respected (p : Params) (e : Engine)
    (hrun : (finalCall p e).1 = Verdict.runNow) (hpos : 0 < floorOf e) :
    floorOf e ≤ monthly p.cashMonthlyPipeline (finalCall p) e := by
  have hnil : violators p.cashMonthlyPipeline (finalCall p) = [] :=
    violators_floorLoop p.cashMonthlyPipeline 10 (baseCall p)
      ((floorMeasure_le_two _).trans (by norm_num))
  by_contra hcon
  push_neg at hcon
  have : e ∈ violators p.cashMonthlyPipeline (finalCall p) :=
    (mem_violators_iff _ _ e).mpr ⟨hrun, hpos, hcon⟩
  rw [hnil] at this
  exact absurd this (by simp)

/-! ## What the floor loop can and cannot change -/

/-- The loop only ever defers an engine; it never invents a verdict. -/
lemma floorLoop_result (cash : ℕ) :
    ∀ (n : ℕ) (st : Engine → Call) (e : Engine),
      floorLoop cash n st e = st e ∨ floorLoop cash n st e = (Verdict.defer, 0) := by
  intro n
  induction n with
  | zero => intro st e; left; rfl
  | succ n ih =>
    intro st e
    cases hw : worstViolator cash st with
    | none => left; rw [floorLoop_succ_none cash n st hw]
    | some a =>
      rw [floorLoop_succ_some cash n st a hw]
      rcases ih (Function.update st a (Verdict.defer, 0)) e with h | h
      · rw [h]
        by_cases hae : e = a
        · subst hae; right; simp
        · left; simp [hae]
      · right; exact h

/-- Engines without a spend floor come out of the loop untouched. -/
lemma floorLoop_eq_of_floorOf_zero (cash : ℕ) :
    ∀ (n : ℕ) (st : Engine → Call) (e : Engine), floorOf e = 0 → floorLoop cash n st e = st e := by
  intro n
  induction n with
  | zero => intro st e _; rfl
  | succ n ih =>
    intro st e he
    cases hw : worstViolator cash st with
    | none => rw [floorLoop_succ_none cash n st hw]
    | some a =>
      have hpos : 0 < floorOf a := ((mem_violators_iff cash st a).mp (worstViolator_mem hw)).2.1
      have hne : e ≠ a := by rintro rfl; omega
      rw [floorLoop_succ_some cash n st a hw, ih _ e he]
      simp [hne]

/-! ## Constraint safety

Every hard constraint in the intake vocabulary really does switch its engine off:
the engine ends up neither `run_now` nor `instrument_now`, and receives no money. -/

/-- An engine is funded exactly when it runs or instruments. -/
def Funded (st : Engine → Call) (e : Engine) : Prop :=
  (st e).1 = Verdict.runNow ∨ (st e).1 = Verdict.instrumentNow

lemma not_funded_zero (p : Params) (e : Engine) (h : ¬Funded (finalCall p) e) :
    bps (finalCall p) e = 0 ∧ monthly p.cashMonthlyPipeline (finalCall p) e = 0 := by
  unfold Funded at h
  push_neg at h
  exact ⟨bps_eq_zero_of_not_funded _ e h.1 h.2,
    monthly_eq_zero_of_not_funded _ _ e h.1 h.2⟩

/-- With no email outbound, Automated Outbound is blocked and unfunded. -/
theorem constraint_noEmail_blocks_automated (p : Params) (h : p.has .noEmail) :
    (finalCall p Engine.automatedOutbound).1 = Verdict.blocked ∧
      ¬Funded (finalCall p) Engine.automatedOutbound := by
  have hb : finalCall p Engine.automatedOutbound = baseCall p Engine.automatedOutbound :=
    floorLoop_eq_of_floorOf_zero _ _ _ _ rfl
  have : baseCall p Engine.automatedOutbound = (Verdict.blocked, 0) := by
    simp [baseCall, callAutomatedOutbound, h]
  rw [hb, this]
  exact ⟨rfl, by simp [Funded, this, hb]⟩

/-- With no phone and no email, Manual Outbound is deferred and unfunded. -/
theorem constraint_noPhoneEmail_defers_manual (p : Params)
    (hp : p.has .noPhone) (he : p.has .noEmail) :
    (finalCall p Engine.manualOutbound).1 = Verdict.defer ∧
      ¬Funded (finalCall p) Engine.manualOutbound := by
  have hb : finalCall p Engine.manualOutbound = baseCall p Engine.manualOutbound :=
    floorLoop_eq_of_floorOf_zero _ _ _ _ rfl
  have : baseCall p Engine.manualOutbound = (Verdict.defer, 0) := by
    simp [baseCall, callManualOutbound, hp, he]
  rw [hb, this]
  exact ⟨rfl, by simp [Funded, this, hb]⟩

/-- With nobody to host it, Community + Partner is deferred and unfunded. -/
theorem constraint_noCommunity_defers_community (p : Params) (h : p.has .noCommunityCapacity) :
    (finalCall p Engine.communityPartner).1 = Verdict.defer ∧
      ¬Funded (finalCall p) Engine.communityPartner := by
  have hb : finalCall p Engine.communityPartner = baseCall p Engine.communityPartner :=
    floorLoop_eq_of_floorOf_zero _ _ _ _ rfl
  have : baseCall p Engine.communityPartner = (Verdict.defer, 0) := by
    simp [baseCall, callCommunityPartner, h]
  rw [hb, this]
  exact ⟨rfl, by simp [Funded, this, hb]⟩

/-- Without the founder, Social Content is deferred and unfunded. -/
theorem constraint_founderWontPost_defers_social (p : Params) (h : p.has .founderWontPost) :
    (finalCall p Engine.socialContent).1 = Verdict.defer ∧
      ¬Funded (finalCall p) Engine.socialContent := by
  have hb : finalCall p Engine.socialContent = baseCall p Engine.socialContent :=
    floorLoop_eq_of_floorOf_zero _ _ _ _ rfl
  have : baseCall p Engine.socialContent = (Verdict.defer, 0) := by
    simp [baseCall, callSocialContent, h]
  rw [hb, this]
  exact ⟨rfl, by simp [Funded, this, hb]⟩

/-- With no paid budget, Paid Media is unfunded whatever the pipeline budget allows. -/
theorem constraint_noPaidBudget_defers_paid (p : Params) (h : p.has .noPaidBudget) :
    ¬Funded (finalCall p) Engine.paidMedia := by
  have hbase : baseCall p Engine.paidMedia = (Verdict.defer, 0) := by
    simp [baseCall, callPaidMedia, h]
  rcases floorLoop_result p.cashMonthlyPipeline 10 (baseCall p) Engine.paidMedia with hf | hf <;>
    simp [Funded, finalCall, hf, hbase]

/-- With no events budget, Events is unfunded. -/
theorem constraint_noEventsBudget_blocks_events (p : Params) (h : p.has .noEventsBudget) :
    ¬Funded (finalCall p) Engine.events := by
  have hbase : baseCall p Engine.events = (Verdict.blocked, 0) := by
    simp [baseCall, callEvents, h]
  rcases floorLoop_result p.cashMonthlyPipeline 10 (baseCall p) Engine.events with hf | hf <;>
    simp [Funded, finalCall, hf, hbase]

/-! ## Regression against the published example

The Acme fixture shipped with the repository, reproduced exactly: the same
verdicts, the same basis points, the same dollars, including the deferral of
Paid Media and Events by the spend-floor loop. -/

/-- The illustrative Acme Security parameters. -/
def acmeParams : Params :=
  { acv := 120000, cashMonthlyPipeline := 25000, aesRamped := 2, aesRamping := 2,
    gtmEngineer := true, constraints := [], selfServe := .noSelfServe,
    developerFacing := false }

theorem acme_bps :
    allEngines.map (fun e => ((finalCall acmeParams e).1, bps (finalCall acmeParams) e))
      = [(Verdict.runNow, 2125), (Verdict.defer, 0), (Verdict.runNow, 3188),
         (Verdict.runNow, 2125), (Verdict.instrumentNow, 750), (Verdict.defer, 0),
         (Verdict.instrumentNow, 750), (Verdict.runNow, 1062), (Verdict.defer, 0)] := by
  decide

theorem acme_allocated :
    allocated 25000 (finalCall acmeParams) = 24999 ∧
      unallocated 25000 (finalCall acmeParams) = 1 ∧
      totalBps (finalCall acmeParams) = 10000 := by
  refine ⟨by decide, by decide, by decide⟩

end NineEngines.Mix
