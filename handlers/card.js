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
var tours = {
  t1: {
    t_id: "t1",
    tour_name: String,
    // player_pair: [[player1, player2]], // player_pair -> team
    // player_waiting: [],
    player: [
      {
        player_name: "",
        player_id: "",
        status: "pair,waiting",
        pair_id: "team1",
      },
    ],
    rounds: [
      {
        round_id: "r1",
        card: [[13], [13], [13], [13]], //Create when use barometer
        board_minuite: 8, //Change board
        tables: [
          //table is same a roomname of socketIO {tour_id + match + table}
          {
            table_id: "b1",
            bidTemp: {
              round: 1,
              declarer: 0,
              passCount: 0,
              isPassOut: true,
              maxContract: -1,
              prevBidDirection: 0,
              firstDirectionSuites: [
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0],
              ],
              doubles: [
                [false, false],
                [false, false],
              ],
            },
          },
        ],
      },
    ],
  },
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
  console.log(_.range(1, 4));
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

exports.nsIsDeclarer = (direction) => {
  return direction % 2 == 0 ? true : false;
};
exports.convert_value_bid = (bid_value) => {
  let find_bid = this.bid_contract()[bid_value].split("_");
  console.log(find_bid);
  return {
    level: find_bid[0],
    suit: find_bid[1],
  };
};

exports.check_db_rdb = (direction, double) => {
  console.log("dob", double);
  return direction % 2 == 0
    ? { double: double[0][0], redouble: double[1][0] }
    : { double: double[0][1], redouble: double[1][1] };
};

exports.check_vul_ns = (board_num) => {
  return board_num % 2 == 0 ? true : false;
};

exports.check_vulnerable = (decalrer, vulnerabel) => {
  let direction = ["N", "E", "S", "W"];
  let convert_declarer = direction[decalrer];
  console.log("convert_declarer", convert_declarer);
  console.log("vulnerabel", vulnerabel);
  if (
    (vulnerabel.includes(convert_declarer) || vulnerabel == "All") &&
    vulnerabel !== "None"
  ) {
    return true;
  } else {
    return false;
  }
};
exports.convert_num_2_card = (num) => {};
exports.convert_card_2_num = (card) => {};

exports.convert_num_2_direction = (num) => {};
exports.convert_direction_2_num = (direction) => {};
