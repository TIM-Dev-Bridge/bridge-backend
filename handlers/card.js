const _ = require("lodash");
// let card = {
//   0: "2_C",
//   1: "3_C",
//   2: "4_C",
//   3: "5_C",
//   8: "10_C",
//   9: "J_C",
//   10: "Q_C",
//   11: "K_C",
//   12: "A_C",
//   13: "2_D",
//   14: "3_D",
//   15: "4_D",
//   16: "5_D",
//   17: "6_D",
//   18: "7_D",
//   19: "8_D",
//   20: "9_D",
//   21: "10_D",
//   22: "J_D",
//   23: "Q_D",
//   24: "K_D",
//   25: "A_D",
//   26: "1_H",
// };

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
exports.random_card = (board_per_round) => {
  let boards = [];
  for (i = 0; i < board_per_round; i++) {
    //value = _.chunk(_.shuffle(_.range(52)), 13).map((hand) => _.sortBy(hand));
    boards.push(
      _.chunk(_.shuffle(_.range(52)), 13).map((hand) => _.sortBy(hand))
    );
  }
  ///Send to front
  // let convert_front = [];
  // value.map((hand) =>
  //   convert_front.push(
  //     hand.map((value) => {
  //       return this.value_to_card(value);
  //     })
  //   )
  // );
  ///Send to front
  let convert_front = [];
  boards.map((board) =>
    board.map((hand) =>
      convert_front.push(
        hand.map((value) => {
          return this.value_to_card(value);
        })
      )
    )
  );
  // console.log('boards', boards)
  return boards;
};

exports.bid_contract = () => {
  let bid_num = [1, 2, 3, 4, 5, 6, 7];
  let bid_pic = ["C", "D", "H", "S", "NT"];
  let bidding = [];

  bid_num.map((num) => {
    bidding.push(...bid_pic.map((pic) => num + "_" + pic));
  });
  return bidding;
};

exports.nsIsDeclarer = (declarer) => {
  return declarer % 2 == 0 ? true : false;
};
exports.convert_value_bid = (max_bid_value) => {
  let find_bid = this.bid_contract()[max_bid_value].split("_");
  return {
    level: find_bid[0],
    suit: find_bid[1],
  };
};

exports.check_ns_db_rdb = (declarer, double) => {
  return declarer % 2 == 0
    ? { nsIsDeclarer: true, double: double[0][0], redouble: double[1][0] }
    : { nsIsDeclarer: false, double: double[0][1], redouble: double[1][1] };
};

exports.check_vulnerable = (declarer, vulnerable_value) => {
  let direction = ["N", "E", "S", "W"];
  let convert_declarer = direction[declarer];
  if (
    (vulnerable_value.includes(convert_declarer) ||
      vulnerable_value == "All") &&
    vulnerable_value !== "None"
  ) {
    return true;
  } else {
    return false;
  }
};

exports.score_table = (
  declarer,
  max_bid_value,
  doubles,
  vulnerable_value,
  tricks
) => {
  let { level, suit } = this.convert_value_bid(max_bid_value);
  let { nsIsDeclarer, double, redouble } = this.check_ns_db_rdb(
    declarer,
    doubles
  );
  let vulnerable = this.check_vulnerable(declarer, vulnerable_value);
  let isDuplicate = true;
  return {
    nsIsDeclarer,
    level,
    suit,
    double,
    redouble,
    vulnerable,
    tricks,
    isDuplicate,
  };
};
