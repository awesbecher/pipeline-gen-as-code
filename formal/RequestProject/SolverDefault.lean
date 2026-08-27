import RequestProject.Solver

/-!
# Regression: the solver at the published defaults

The reference repository ships a fixture, `solver_default`, recording what the
capacity engine returns at its default assumptions: $1.2M base ARR, 6% churn,
$1.0M expansion, a $7.0M target, $120K ACV, a 178-day median cycle, two ramped
and two ramping AEs, a 30% haircut and at most two hires a month.

Everything below reproduces that fixture *exactly*, in rational arithmetic, and
every proof is checked by the kernel — the reference implementation computes the
same numbers in IEEE doubles and so agrees after rounding:

| fixture field           | reference value | theorem                              |
| ----------------------- | --------------- | ------------------------------------ |
| `existing_gross_usd`    | 3 616 652       | `solverDefault_existingGross`        |
| `new_ae_hires`          | 7               | `solverDefault_hires`                |
| `new_ae_hire_months`    | 1 1 2 2 3 3 5   | `solverDefault_newSeats`             |
| `gross_capacity_usd`    | 6 991 639       | `solverDefault_grossCapacity`        |
| `exit_arr_usd`          | 7 022 147       | `solverDefault_exitArr`              |
| `shortfall_usd`         | 0               | `solverDefault_shortfall`            |
| `status.ae_bookings`    | `clears`        | `solverDefault_clears`               |
-/

namespace NineEngines.Solver

open NineEngines.Capacity NineEngines.Hiring

/-- The engine's default assumptions. -/
def solverDefault : Inputs :=
  { baseArr := 1200000, churnPct := 3/50, expansion := 1000000, targetArr := 7000000,
    acv := 120000, cycleDays := 178, steadyOverride := 0, haircut := 3/10,
    maxPerMonth := 2, rampedAes := 2, rampingTenures := [4, 3] }

/-! ### Unit economics -/

private lemma planMonths_eq : Finset.Icc (1:ℤ) 12 = {1,2,3,4,5,6,7,8,9,10,11,12} := by decide

lemma solverDefault_prof : solverDefault.prof = stdRamp := rfl

lemma solverDefault_maxPerMonth : solverDefault.maxPerMonth = 2 := rfl

/-- A fully ramped rep books $999 996 a year at the anchor cycle and $120K ACV. -/
lemma solverDefault_steady : solverDefault.steady = 999996 := by
  norm_num [Inputs.steady, solverDefault, steadyAnnual, anchorDealsPerYear, anchorCycleDays,
    steadyCap]

lemma solverDefault_steadyMo : solverDefault.steadyMo = 83333 := by
  rw [Inputs.steadyMo, solverDefault_steady]; norm_num

private lemma seatF_eq (m : ℕ) : solverDefault.seatF m = seatYear1 stdRamp 83333 m := by
  rw [Inputs.seatF, solverDefault_prof, solverDefault_steadyMo]

private lemma seatF_1 : solverDefault.seatF 1 = 2999988/5 := by
  rw [seatF_eq]; simp [seatYear1, planMonths, seatMonth, rampRate, stdRamp, planMonths_eq]
  norm_num

private lemma seatF_2 : solverDefault.seatF 2 = 2583323/5 := by
  rw [seatF_eq]; simp [seatYear1, planMonths, seatMonth, rampRate, stdRamp, planMonths_eq]
  norm_num

private lemma seatF_3 : solverDefault.seatF 3 = 2166658/5 := by
  rw [seatF_eq]; simp [seatYear1, planMonths, seatMonth, rampRate, stdRamp, planMonths_eq]
  norm_num

private lemma seatF_4 : solverDefault.seatF 4 = 1749993/5 := by
  rw [seatF_eq]; simp [seatYear1, planMonths, seatMonth, rampRate, stdRamp, planMonths_eq]
  norm_num

private lemma seatF_5 : solverDefault.seatF 5 = 2749989/10 := by
  rw [seatF_eq]; simp [seatYear1, planMonths, seatMonth, rampRate, stdRamp, planMonths_eq]
  norm_num

private lemma seatF_6 : solverDefault.seatF 6 = 999996/5 := by
  rw [seatF_eq]; simp [seatYear1, planMonths, seatMonth, rampRate, stdRamp, planMonths_eq]
  norm_num

/-! ### The carried team and the requirement -/

/-- Two ramped AEs notionally hired in month `-8`, and two ramping AEs with four
and three months of tenure at plan month 1. -/
lemma solverDefault_carried : solverDefault.carriedHires = [-8, -8, -2, -1] := by
  simp [Inputs.carriedHires, Inputs.rampLength, solverDefault]
  decide

/-- The carried team books $3 616 652.20 in year one (fixture: 3 616 652). -/
theorem solverDefault_existingGross : solverDefault.existingGross = 18083261/5 := by
  rw [Inputs.existingGross, solverDefault_carried, solverDefault_prof, solverDefault_steadyMo]
  simp [seatYear1, planMonths, seatMonth, rampRate, stdRamp, planMonths_eq]
  norm_num

lemma solverDefault_grossNeeded : solverDefault.bridge.grossNeeded = 6960000 := by
  norm_num [Bridge.grossNeeded, Bridge.netNewNeeded, Bridge.expansionNet, Bridge.churnD,
    Inputs.bridge, solverDefault]

lemma solverDefault_need : solverDefault.need = 16716739/5 := by
  rw [Inputs.need, solverDefault_grossNeeded, solverDefault_existingGross]; norm_num

/-! ### The greedy pass -/

private lemma frontCapacity_0 : capacityOf solverDefault.seatF (frontLoaded 2 0) = 0 := by
  rw [show frontLoaded 2 0 = [] from by decide]
  simp [capacityOf]

private lemma frontCapacity_1 :
    capacityOf solverDefault.seatF (frontLoaded 2 1) = 2999988/5 := by
  rw [show frontLoaded 2 1 = [1] from by decide]
  simp [capacityOf, seatF_1]

private lemma frontCapacity_2 :
    capacityOf solverDefault.seatF (frontLoaded 2 2) = 5999976/5 := by
  rw [show frontLoaded 2 2 = [1, 1] from by decide]
  simp [capacityOf, seatF_1]
  norm_num

private lemma frontCapacity_3 :
    capacityOf solverDefault.seatF (frontLoaded 2 3) = 8583299/5 := by
  rw [show frontLoaded 2 3 = [1, 1, 2] from by decide]
  simp [capacityOf, seatF_1, seatF_2]
  norm_num

private lemma frontCapacity_4 :
    capacityOf solverDefault.seatF (frontLoaded 2 4) = 11166622/5 := by
  rw [show frontLoaded 2 4 = [1, 1, 2, 2] from by decide]
  simp [capacityOf, seatF_1, seatF_2]
  norm_num

private lemma frontCapacity_5 :
    capacityOf solverDefault.seatF (frontLoaded 2 5) = 13333280/5 := by
  rw [show frontLoaded 2 5 = [1, 1, 2, 2, 3] from by decide]
  simp [capacityOf, seatF_1, seatF_2, seatF_3]
  norm_num

private lemma frontCapacity_6 :
    capacityOf solverDefault.seatF (frontLoaded 2 6) = 15499938/5 := by
  rw [show frontLoaded 2 6 = [1, 1, 2, 2, 3, 3] from by decide]
  simp [capacityOf, seatF_1, seatF_2, seatF_3]
  norm_num

private lemma frontCapacity_7 :
    capacityOf solverDefault.seatF (frontLoaded 2 7) = 17249931/5 := by
  rw [show frontLoaded 2 7 = [1, 1, 2, 2, 3, 3, 4] from by decide]
  simp [capacityOf, seatF_1, seatF_2, seatF_3, seatF_4]
  norm_num

/-- Six hires leave the plan short; seven clear it. -/
theorem solverDefault_hireCount :
    hireCount solverDefault.seatF solverDefault.need 2 = 7 := by
  rw [hireCount]
  norm_num [leastUpTo, solverDefault_need, frontCapacity_0, frontCapacity_1, frontCapacity_2,
    frontCapacity_3, frontCapacity_4, frontCapacity_5, frontCapacity_6, frontCapacity_7]

theorem solverDefault_greedy : solverDefault.greedySeats = [1, 1, 2, 2, 3, 3, 4] := by
  rw [Inputs.greedySeats, solverDefault_maxPerMonth, solverDefault_hireCount]; decide

/-! ### The relaxation pass -/

/-- The trailing seat slides from month 4 to month 5, and no further: month 6
would drop the plan below the requirement. -/
theorem solverDefault_bestMonth_last :
    bestMonth solverDefault.seatF solverDefault.need [1, 1, 2, 2, 3, 3] 2 12 4 = 5 := by
  norm_num [bestMonth, capacityOf, seatF_1, seatF_2, seatF_3, seatF_4, seatF_5, seatF_6,
    solverDefault_need]

/-- **The published hire schedule.** Fixture `new_ae_hire_months`: 1 1 2 2 3 3 5. -/
theorem solverDefault_newSeats : solverDefault.newSeats = [1, 1, 2, 2, 3, 3, 5] := by
  rw [Inputs.newSeats, solverDefault_maxPerMonth, solverDefault_greedy, relax]
  norm_num [relaxAux, bestMonth, capacityOf, seatF_1, seatF_2, seatF_3, seatF_4, seatF_5, seatF_6,
    solverDefault_need]

/-- Fixture `new_ae_hires`: seven new AEs. -/
theorem solverDefault_hires : solverDefault.newSeats.length = 7 := by
  rw [solverDefault_newSeats]; rfl

/-! ### The plan -/

/-- Fixture `gross_capacity_usd`: $6 991 638.70, which the reference rounds to
6 991 639. -/
theorem solverDefault_grossCapacity : solverDefault.grossCapacity = 69916387/10 := by
  rw [Inputs.grossCapacity, solverDefault_existingGross, solverDefault_newSeats]
  simp [capacityOf, seatF_1, seatF_2, seatF_3, seatF_5]
  norm_num

/-- Fixture `exit_arr_usd`: $7 022 147.09, which the reference rounds to
7 022 147. -/
theorem solverDefault_exitArr : solverDefault.exitArr = 702214709/100 := by
  rw [Inputs.exitArr, Bridge.exitArr, Bridge.netNewLogo, Bridge.expansionNet, Bridge.churnD,
    solverDefault_grossCapacity]
  norm_num [Inputs.bridge, solverDefault]

/-- Fixture `status.ae_bookings = clears`: the plan reaches the $7.0M target. -/
theorem solverDefault_clears : solverDefault.targetArr ≤ solverDefault.exitArr := by
  rw [solverDefault_exitArr]; norm_num [solverDefault]

/-- Fixture `shortfall_usd`: nothing left uncovered. -/
theorem solverDefault_shortfall :
    solverDefault.bridge.shortfall solverDefault.grossCapacity = 0 := by
  rw [Bridge.shortfall, solverDefault_grossNeeded, solverDefault_grossCapacity]; norm_num

/-- The schedule keeps every hire inside the plan year and inside the two-a-month
cap. -/
theorem solverDefault_feasible : Feasible 2 solverDefault.newSeats := by
  have := solverDefault.newSeats_feasible (by rw [solverDefault_maxPerMonth]; norm_num)
  rwa [solverDefault_maxPerMonth] at this

/-- **Seven hires is the fewest that can work.** No schedule of at most two hires
a month with fewer than seven AEs covers the requirement. -/
theorem solverDefault_minimal (hs : List ℕ) (hfeas : Feasible 2 hs)
    (hclear : solverDefault.need ≤ capacityOf solverDefault.seatF hs) : 7 ≤ hs.length := by
  have hmo : 0 ≤ solverDefault.steadyMo := by rw [solverDefault_steadyMo]; norm_num
  have h := solverDefault.newSeats_minimal hmo (by rw [solverDefault_maxPerMonth]; norm_num) hs
    (by rwa [solverDefault_maxPerMonth]) hclear
  rwa [solverDefault_hires] at h

end NineEngines.Solver
