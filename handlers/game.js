const _ = require("lodash");

exports.getPlayer = (tour_data, player_id) => {
  return _.find(tour_data.players, ["name", player_id]);
};
exports.getPairId = (tour_data, player_id) => {
  return this.getPlayer(tour_data, player_id).pair_id;
};

exports.getSelfScore = (pair_id, game_data) => {
  let selfScore = game_data.map(({ round_num, tables }) => {
    let myTeam = tables
      .filter(({ versus }) => versus.includes(pair_id))
      .map(({ table_id, cur_board, directions, score }) => ({
        table_id,
        cur_board,
        directions,
        score,
      }));
    return { round_num, tables: myTeam };
  });
  return selfScore;
};

exports.getSelfIMP = (pair_id, game_data) => {
  let selfScore = game_data.map(({ round_num, tables }) => {
    let myTeam = tables
      .filter(({ versus }) => versus.includes(pair_id))
      .map(({ table_id, cur_board, directions, score }) => ({
        table_id,
        cur_board,
        directions,
        score,
      }));
    return { round_num, tables: myTeam };
  });
  return selfScore;
};
