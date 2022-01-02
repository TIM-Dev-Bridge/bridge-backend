const _ = require("lodash");
let card = {
  0: "2_C",
  1: "3_C",
  2: "4_C",
  3: "5_C",
  8: "10_C",
  9: "J_C",
  10: "Q_C",
  11: "K_C",
  12: "A_C",
  13: "2_D",
  14: "3_D",
  15: "4_D",
  16: "5_D",
  17: "6_D",
  18: "7_D",
  19: "8_D",
  20: "9_D",
  21: "10_D",
  22: "J_D",
  23: "Q_D",
  24: "K_D",
  25: "A_D",
  26: "1_H",
};

//------------------------------------------------------Bridge------------------------------------------------------//
exports.value_to_card = (value) => {
  pic_card = ["C", "D", "H", "S"];
  num_card = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
  if (value === 0) {
    return "2_C";
  } else {
    return `${num_card[value % 13]}_${pic_card[parseInt(value / 13)]}`;
  }
};
exports.random_card = () => {
  let value = [];
  value = _.chunk(_.shuffle(_.range(52)), 13).map((hand) => _.sortBy(hand));
  //Send to front
  let convert_front = [];
  value.map((hand) =>
    convert_front.push(
      hand.map((value) => {
        return this.value_to_card(value);
      })
    )
  );
  console.log(value);
  return value;
};

exports.bid_contract = () => {
  let bid_num = [2, 3, 4, 5, 6, 7];
  let bid_pic = ["C", "D", "H", "S", "NT"];
  let bidding = [];

  bid_num.map((num) => {
    bidding.push(...bid_pic.map((pic) => num + "_" + pic));
  });
};
