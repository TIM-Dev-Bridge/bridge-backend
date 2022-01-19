let play_data = {
  declarer: "N",
  contract: 30,
  double: 0,
  redouble: 0,
  trick: [13, 0],
};
exports.score = (
  play_data = {
    declarer: "N",
    contract: 32,
    double: false,
    redouble: true,
    trick: [13, 0],
  }
) => {
  let target = Math.ceil((play_data.contract + 1) / 5);
  let suite = play_data.contract % 5;
  let at_least = play_data.trick[0] - 6;
  console.log("start");
  if (at_least >= target) {
    //if (suite)
    let contract_point = calContractPoint(
      suite,
      target,
      play_data.double,
      play_data.redouble
    );
    let total_score = "";
    console.log(`contract_point`, contract_point);
  }
};
const calContractPoint = (suite, target, double, redouble) => {
  let points = 0;
  suite < 2 ? (points += target * 20) : (points += target * 30);
  if (suite == 4) points += 10;
  if (double) points *= 2;
  if (redouble) points *= 4;
  console.log("points", points);
  return points;
};
