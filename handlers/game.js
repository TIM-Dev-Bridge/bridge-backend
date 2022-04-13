const _ = require("lodash");

exports.getPlayer = (tour_data, player_id) => {
  return _.find(tour_data.players, ["name", player_id]);
};
exports.getPairId = (tour_data, player_id) => {
  return this.getPlayer(tour_data, player_id).pair_id;
};

// exports.getSelfScore = (pair_id, game_data) => {
//   let selfScore = game_data.map(({ round_num, tables }) => {
//     let myTeam = tables
//       .filter(({ versus }) => versus.includes(pair_id))
//       .map(({ table_id, cur_board, directions, score }) => ({
//         table_id,
//         cur_board,
//         directions,
//         score,
//       }));
//     return { round_num, tables: myTeam };
//   });
//   return selfScore;
// };

// exports.getSelfIMP = (pair_id, game_data) => {
//   let selfScore = game_data.map(({ round_num, tables }) => {
//     let myTeam = tables
//       .filter(({ versus }) => versus.includes(pair_id))
//       .map(({ table_id, cur_board, directions, score }) => ({
//         table_id,
//         cur_board,
//         directions,
//         score,
//       }));
//     return { round_num, tables: myTeam };
//   });
//   return selfScore;
// };
exports.getSelfScore = (id, boardScores) => {
  let selfScore = boardScores.map(({ board_num, pairs_score }) => {
    let myTeam = pairs_score
      .filter(({ pair_id }) => pair_id == id)
      .map(({ pair_id, score }) => ({
        pair_id,
        score,
      }));
    return { board_num, score: myTeam };
  });
  return selfScore;
};

exports.getSelfIMP = (id, boardScores) => {
  let selfIMP = boardScores.map(({ board_num, pairs_score }) => {
    let myTeam = pairs_score
      .filter(({ pair_id }) => pair_id == id)
      .map(({ pair_id, imp }) => ({
        pair_id,
        imp,
      }));
    return { board_num, score: myTeam };
  });
  return selfIMP;
};

exports.getSelfScoreArray = (id, boardScores) => {
  let selfScore = boardScores.map(({ pairs_score }) =>
    pairs_score.filter(({ pair_id }) => pair_id == id).map((pair) => pair.score)
  );
  return _.flatMap(selfScore).filter((score) => score != null);
};
exports.getSelfIMPArray = (id, boardScores) => {
  let selfIMP = boardScores.map(({ pairs_score }) =>
    pairs_score.filter(({ pair_id }) => pair_id == id).map((pair) => pair.imp)
  );
  return _.flatMap(selfIMP).filter((imp) => imp != null);
};

exports.sumSelfScoreArray = (id, boardScore) => {
  let sum = _.sum(this.getSelfScoreArray(id, boardScore));
  return sum;
};
exports.sumSelfIMPArray = (id, boardScore) => {
  let sum = _.sum(this.getSelfIMPArray(id, boardScore));
  return sum;
};
