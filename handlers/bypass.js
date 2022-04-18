exports.generateFullGameData = () => {
  let fullgame = {
    tour_name: "Mark1",
    players: [
      {
        id: "",
        name: "plantA",
        status: "in-pair",
        pair_id: 1,
        socket_id: "aaabbb",
      },
      {
        id: "",
        name: "peterpan",
        status: "in-pair",
        pair_id: 1,
        socket_id: "cccaaa",
      },
      {
        id: "",
        name: "mutizaki",
        status: "in-pair",
        pair_id: 4,
        socket_id: "wwweee",
      },
      {
        id: "",
        name: "seperite",
        status: "in-pair",
        pair_id: 3,
        socket_id: "qweqwe",
      },
      {
        id: "",
        name: "pokemon",
        status: "in-pair",
        pair_id: 2,
      },
      {
        id: "",
        name: "carspian",
        status: "in-pair",
        pair_id: 3,
      },
      {
        id: "",
        name: "qwerty",
        status: "in-pair",
        pair_id: 4,
      },
      {
        id: "",
        name: "teseded",
        status: "in-pair",
        pair_id: 2,
      },
    ],
    max_player: 20,
    board_round: 3,
    board_per_round: 1,
    rounds: [
      {
        round_num: 1,
        cards: [
          [
            [6, 7, 10, 17, 18, 20, 24, 26, 31, 40, 42, 44, 50],
            [2, 3, 4, 14, 15, 16, 22, 28, 29, 37, 41, 45, 46],
            [0, 1, 5, 19, 21, 23, 25, 30, 34, 35, 43, 47, 51],
            [8, 9, 11, 12, 13, 27, 32, 33, 36, 38, 39, 48, 49],
          ],
        ],
        tables: [
          {
            table_id: "r1b1",
            status: "temp",
            boards: [1],
            versus: "1,3",
            directions: [
              {
                id: "",
                direction: 0,
              },
              {
                id: "",
                direction: 2,
              },
              {
                id: "",
                direction: 1,
              },
              {
                id: "",
                direction: 3,
              },
            ],
            cur_board: 2,
            bidding: {
              round: 0,
              declarer: 0,
              passCount: 0,
              isPassOut: true,
              maxContract: -1,
              prevBidDirection: 0,
              doubles: [
                [false, false],
                [false, false],
              ],
              firstDirectionSuites: [
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0],
              ],
            },
            playing: {
              turn: 1,
              doubles: [
                [false, false],
                [false, false],
              ],
              bidSuite: 0,
              communityCards: [],
              tricks: [0, 1],
              playedCards: [
                {
                  0: 6,
                  1: 2,
                  2: 1,
                  3: 9,
                },
                { 1: 3, 2: 5, 3: 11, 0: 7 },
                { 2: 19, 3: 12, 0: 50 },
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
              ],
            },
            score: [0, 800],
          },
          {
            table_id: "r1b2",
            status: "temp",
            boards: [1],
            versus: "2,4",
            directions: [
              {
                id: "",
                direction: 0,
              },
              {
                id: "",
                direction: 2,
              },
              {
                id: "",
                direction: 1,
              },
              {
                id: "",
                direction: 3,
              },
            ],
            cur_board: 1,
            bidding: {
              round: 0,
              declarer: 0,
              passCount: 0,
              isPassOut: true,
              maxContract: -1,
              prevBidDirection: 0,
              doubles: [
                [false, false],
                [false, false],
              ],
              firstDirectionSuites: [
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0],
              ],
            },
            playing: {
              turn: 1,
              doubles: [
                [false, false],
                [false, false],
              ],
              bidSuite: 0,
              communityCards: [],
              tricks: [0, 1],
              playedCards: [
                {
                  0: 18,
                  1: 1,
                  2: 16,
                  3: 17,
                },
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
              ],
            },
            score: [120, 300],
          },
        ],
      },
      {
        round_num: 2,
        cards: [
          [
            [1, 3, 4, 10, 13, 15, 18, 22, 27, 28, 34, 44, 51],
            [2, 6, 8, 17, 24, 26, 36, 38, 41, 42, 45, 46, 49],
            [0, 5, 9, 11, 14, 20, 23, 32, 33, 35, 40, 47, 50],
            [7, 12, 16, 19, 21, 25, 29, 30, 31, 37, 39, 43, 48],
          ],
        ],
        tables: [
          {
            table_id: "r2b1",
            status: "waiting",
            boards: [2],
            versus: "1,4",
            directions: [
              {
                id: "",
                direction: 0,
              },
              {
                id: "",
                direction: 2,
              },
              {
                id: "",
                direction: 1,
              },
              {
                id: "",
                direction: 3,
              },
            ],
            cur_board: 2,
            bidding: {
              round: 0,
              declarer: 0,
              passCount: 0,
              isPassOut: true,
              maxContract: -1,
              prevBidDirection: 0,
              doubles: [
                [false, false],
                [false, false],
              ],
              firstDirectionSuites: [
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0],
              ],
            },
            playing: {
              turn: 1,
              doubles: [
                [false, false],
                [false, false],
              ],
              bidSuite: 0,
              communityCards: [],
              tricks: [0, 1],
              playedCards: [
                {
                  0: 18,
                  1: 1,
                  2: 16,
                  3: 17,
                },
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
              ],
            },
            score: [150, 200],
          },
          {
            table_id: "r2b2",
            status: "waiting",
            boards: [2],
            versus: "2,3",
            directions: [
              {
                id: "",
                direction: 0,
              },
              {
                id: "",
                direction: 2,
              },
              {
                id: "",
                direction: 1,
              },
              {
                id: "",
                direction: 3,
              },
            ],
            cur_board: 2,
            bidding: {
              round: 0,
              declarer: 0,
              passCount: 0,
              isPassOut: true,
              maxContract: -1,
              prevBidDirection: 0,
              doubles: [
                [false, false],
                [false, false],
              ],
              firstDirectionSuites: [
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0],
              ],
            },
            playing: {
              turn: 1,
              doubles: [
                [false, false],
                [false, false],
              ],
              bidSuite: 0,
              communityCards: [],
              tricks: [0, 1],
              playedCards: [
                {
                  0: 18,
                  1: 1,
                  2: 16,
                  3: 17,
                },
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
              ],
            },
            score: [0, 100],
          },
        ],
      },
      {
        round_num: 3,
        cards: [
          [
            [2, 7, 9, 13, 24, 27, 30, 32, 33, 34, 41, 46, 51],
            [1, 14, 16, 22, 23, 25, 29, 37, 38, 40, 43, 47, 49],
            [3, 4, 6, 11, 12, 15, 17, 18, 21, 28, 35, 36, 48],
            [0, 5, 8, 10, 19, 20, 26, 31, 39, 42, 44, 45, 50],
          ],
        ],
        tables: [
          {
            table_id: "r3b1",
            status: "waiting",
            boards: [3],
            versus: "1,3",
            directions: [
              {
                id: "",
                direction: 0,
              },
              {
                id: "",
                direction: 2,
              },
              {
                id: "",
                direction: 1,
              },
              {
                id: "",
                direction: 3,
              },
            ],
            cur_board: 3,
            bidding: {
              round: 0,
              declarer: 0,
              passCount: 0,
              isPassOut: true,
              maxContract: -1,
              prevBidDirection: 0,
              doubles: [
                [false, false],
                [false, false],
              ],
              firstDirectionSuites: [
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0],
              ],
            },
            playing: {
              turn: 1,
              doubles: [
                [false, false],
                [false, false],
              ],
              bidSuite: 0,
              communityCards: [],
              tricks: [0, 1],
              playedCards: [
                {
                  0: 18,
                  1: 1,
                  2: 16,
                  3: 17,
                },
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
              ],
            },
            score: [110, 0],
          },
          {
            table_id: "r3b2",
            status: "waiting",
            boards: [3],
            versus: "2,4",
            directions: [
              {
                id: "",
                direction: 0,
              },
              {
                id: "",
                direction: 2,
              },
              {
                id: "",
                direction: 1,
              },
              {
                id: "",
                direction: 3,
              },
            ],
            cur_board: 3,
            bidding: {
              round: 0,
              declarer: 0,
              passCount: 0,
              isPassOut: true,
              maxContract: -1,
              prevBidDirection: 0,
              doubles: [
                [false, false],
                [false, false],
              ],
              firstDirectionSuites: [
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0],
              ],
            },
            playing: {
              turn: 1,
              doubles: [
                [false, false],
                [false, false],
              ],
              bidSuite: 0,
              communityCards: [],
              tricks: [0, 1],
              playedCards: [
                {
                  0: 18,
                  1: 1,
                  2: 16,
                  3: 17,
                },
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
              ],
            },
            score: [50, 0],
          },
        ],
      },
    ],
    boardScores: [
      {
        board_num: 1,
        pairs_score: [
          {
            pair_id: 1,
            score: 50,
            direction: 0,
          },
          {
            pair_id: 2,
            score: 0,
            direction: 1,
          },
          {
            pair_id: 3,
            score: 10,
            direction: 0,
          },
          {
            pair_id: 4,
            score: 20,
            direction: 1,
          },
          {
            pair_id: 5,
            score: 30,
            direction: 0,
          },
        ],
      },
      {
        board_num: 2,
        pairs_score: [
          {
            pair_id: 1,
            score: 80,
            direction: 0,
          },
          {
            pair_id: 2,
            score: 70,
            direction: 1,
          },
          {
            pair_id: 3,
            score: 0,
            direction: 0,
          },
          {
            pair_id: 4,
            score: 0,
            direction: 1,
          },
          {
            pair_id: 5,
            score: 900,
            direction: 0,
          },
        ],
      },
      {
        board_num: 3,
        pairs_score: [
          {
            pair_id: 1,
            score: 0,
            direction: 0,
          },
          {
            pair_id: 2,
            score: 100,
            direction: 1,
          },
          {
            pair_id: 3,
            score: 200,
            direction: 0,
          },
          {
            pair_id: 4,
            score: 300,
            direction: 1,
          },
          {
            pair_id: 5,
            score: 400,
            direction: 0,
          },
        ],
      },
      {
        board_num: 4,
        pairs_score: [
          {
            pair_id: 1,
            score: 500,
            direction: 0,
          },
          {
            pair_id: 2,
            score: 600,
            direction: 1,
          },
          {
            pair_id: 3,
            score: 700,
            direction: 0,
          },
          {
            pair_id: 4,
            score: 0,
            direction: 1,
          },
          {
            pair_id: 5,
            score: 10,
            direction: 0,
          },
        ],
      },
      {
        board_num: 5,
        pairs_score: [
          {
            pair_id: 1,
            score: 0,
            direction: 0,
          },
          {
            pair_id: 2,
            score: 40,
            direction: 1,
          },
          {
            pair_id: 3,
            score: 940,
            direction: 0,
          },
          {
            pair_id: 4,
            score: 80,
            direction: 1,
          },
          {
            pair_id: 5,
            score: 70,
            direction: 0,
          },
        ],
      },
      {
        board_num: 6,
        pairs_score: [
          {
            pair_id: 1,
            score: 70,
            direction: 0,
          },
          {
            pair_id: 2,
            score: 45,
            direction: 1,
          },
          {
            pair_id: 3,
            score: 95,
            direction: 0,
          },
          {
            pair_id: 4,
            score: 79,
            direction: 1,
          },
          {
            pair_id: 5,
            score: 780,
            direction: 0,
          },
        ],
      },
    ],
    rankPair: [
      {
        pair_id: 1,
      },
      {
        pair_id: 2,
      },
      {
        pair_id: 3,
      },
      {
        pair_id: 4,
      },
      {
        pair_id: 5,
      },
    ],
  };
  return fullgame;
};
