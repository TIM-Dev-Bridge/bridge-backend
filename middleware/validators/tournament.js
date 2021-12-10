exports.validateCreateTournament = (data) => {
  let errors = {};
  //TC_CT_08
  if (
    data.tour_name &&
    data.max_player &&
    data.type &&
    data.password &&
    data.player_name &&
    data.player_team &&
    data.time_start &&
    data.status &&
    data.board_to_play &&
    data.minute_board &&
    data.board_round &&
    data.movement &&
    data.scoring &&
    data.barometer &&
    data.createBy
  ) {
    errors.required = "All input is required";
  }

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};
