// const calContractPoint = (suit, level, double, redouble) => {
//   let points = 0;
//   suit < 2 ? (points += level * 20) : (points += level * 30);
//   if (suit == 4) points += 10;
//   return points * ((double && 2) + (redouble && 4) || 1);
// };

// const calOvertrickPoint = (
//   trick,
//   target,
//   suit,
//   double,
//   redouble,
//   vulnerable
// ) => {
//   const overtricks = Math.max(trick - target, 0);
//   return !double && !redouble
//     ? suit < 2
//       ? overtricks * 20
//       : overtricks * 30
//     : overtricks * 100 * ((redouble && 2) || 1) * ((vulnerable && 2) || 1);
// };

// const calBonusPoint = (
//   contractPoints,
//   vulnerable,
//   isDuplicate,
//   target,
//   double,
//   redouble
// ) => {
//   const gameBonus = contractPoints < 100 ? 50 : vulnerable ? 500 : 300;
//   const slamBonus = Math.max(
//     (target - 11) * 500 * ((vulnerable && 1.5) || 1),
//     0
//   );
//   const insultBonus = ((double && 1) + (redouble && 2)) * 50;
//   // console.log('gameBonus',gameBonus)
//   // console.log('slamBonus',slamBonus)
//   // console.log('insultBonus',insultBonus)
//   return gameBonus + slamBonus + insultBonus;
// };

// const calPenaltyPoint = (target, trick, vulnerable, double, redouble) => {
//   const undertricks = Math.max(target - trick, 0);
//   if (double || redouble) {
//     const rawPoint = [100, 200, 200, 300, 300, 300, 300].reduce(
//       (total, cost, index) => {
//         return index < undertricks ? total + cost : total;
//       },
//       Math.min(undertricks * 100, vulnerable ? 300 : 0)
//     );
//     return rawPoint * ((redouble && 2) || 1);
//   }
//   return undertricks * 50 * ((vulnerable && 2) || 1);
// };

// const calScore = (
//   nsIsDeclarer,
//   level,
//   suit,
//   double,
//   redouble,
//   vulnerable,
//   tricks,
//   isDuplicate
// ) => {
//   const target = level + 6;
//   const trick = nsIsDeclarer ? tricks[0] : tricks[1];
//   let declarerScore = 0;
//   let defenderScore = 0;
//   if (trick >= target) {
//     const contractPoint = calContractPoint(suit, level, double, redouble);
//     const overtrickPoint = calOvertrickPoint(
//       trick,
//       target,
//       suit,
//       double,
//       redouble,
//       vulnerable
//     );
//     const bonusPoint = calBonusPoint(
//       contractPoint,
//       vulnerable,
//       isDuplicate,
//       target,
//       double,
//       redouble
//     );
//     console.log("contractPoint", contractPoint);
//     console.log("overtrickPoint", overtrickPoint);
//     console.log("bonusPoint", bonusPoint);
//     declarerScore = contractPoint + overtrickPoint + bonusPoint;
//   } else {
//     penaltyPoint = calPenaltyPoint(target, trick, vulnerable, double, redouble);
//     console.log("penaltyPoint", penaltyPoint);
//     defenderScore = penaltyPoint;
//   }
//   return nsIsDeclarer
//     ? [declarerScore, defenderScore]
//     : [defenderScore, declarerScore];
// };

// exports = {
//   calContractPoint,
//   calOvertrickPoint,
//   calBonusPoint,
//   calPenaltyPoint,
//   calScore,
// };

exports.calContractPoint = (suit, level, double, redouble) => {
  let points = 0;
  suit < 2 ? (points += level * 20) : (points += level * 30);
  if (suit == 4) points += 10;
  return points * ((double && 2) + (redouble && 4) || 1);
};

exports.calOvertrickPoint = (
  trick,
  target,
  suit,
  double,
  redouble,
  vulnerable
) => {
  const overtricks = Math.max(trick - target, 0);
  return !double && !redouble
    ? suit < 2
      ? overtricks * 20
      : overtricks * 30
    : overtricks * 100 * ((redouble && 2) || 1) * ((vulnerable && 2) || 1);
};

exports.calBonusPoint = (
  contractPoints,
  vulnerable,
  isDuplicate,
  target,
  double,
  redouble
) => {
  const gameBonus = contractPoints < 100 ? 50 : vulnerable ? 500 : 300;
  const slamBonus = Math.max(
    (target - 11) * 500 * ((vulnerable && 1.5) || 1),
    0
  );
  const insultBonus = ((double && 1) + (redouble && 2)) * 50;
  // console.log('gameBonus',gameBonus)
  // console.log('slamBonus',slamBonus)
  // console.log('insultBonus',insultBonus)
  return gameBonus + slamBonus + insultBonus;
};

exports.calPenaltyPoint = (target, trick, vulnerable, double, redouble) => {
  const undertricks = Math.max(target - trick, 0);
  if (double || redouble) {
    const rawPoint = [100, 200, 200, 300, 300, 300, 300].reduce(
      (total, cost, index) => {
        return index < undertricks ? total + cost : total;
      },
      Math.min(undertricks * 100, vulnerable ? 300 : 0)
    );
    return rawPoint * ((redouble && 2) || 1);
  }
  return undertricks * 50 * ((vulnerable && 2) || 1);
};

exports.calScore = (
  nsIsDeclarer,
  level,
  suit,
  double,
  redouble,
  vulnerable,
  tricks,
  isDuplicate
) => {
  const target = level + 6;
  const trick = nsIsDeclarer ? tricks[0] : tricks[1];
  let declarerScore = 0;
  let defenderScore = 0;
  if (trick >= target) {
    const contractPoint = this.calContractPoint(suit, level, double, redouble);
    const overtrickPoint = this.calOvertrickPoint(
      trick,
      target,
      suit,
      double,
      redouble,
      vulnerable
    );
    const bonusPoint = this.calBonusPoint(
      contractPoint,
      vulnerable,
      isDuplicate,
      target,
      double,
      redouble
    );
    console.log("contractPoint", contractPoint);
    console.log("overtrickPoint", overtrickPoint);
    console.log("bonusPoint", bonusPoint);
    declarerScore = contractPoint + overtrickPoint + bonusPoint;
  } else {
    penaltyPoint = this.calPenaltyPoint(target, trick, vulnerable, double, redouble);
    console.log("penaltyPoint", penaltyPoint);
    defenderScore = penaltyPoint;
  }
  return nsIsDeclarer
    ? [declarerScore, defenderScore]
    : [defenderScore, declarerScore];
};
