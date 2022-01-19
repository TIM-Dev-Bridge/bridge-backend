let board = [];
let direction = ["N", "E", "S", "W"];
let vul = ["None", "N-S", "E-W", "All"];
let round = 16;
let temp_vul = [];
exports.createBoard = () => {
  for (let i = 0; i < round; i++) {
    if (i % 4 == 0 && i != 0) {
      temp_vul = vul.shift();
      vul.push(temp_vul);
    }
    board.push({
      board_number: i + 1,
      dealer: direction[i % 4],
      vulnerable: vul[i % 4],
    });
  }
  console.log(`board`, board);
  return board;
};
