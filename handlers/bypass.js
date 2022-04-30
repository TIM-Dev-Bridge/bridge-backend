exports.generateFullGameData = () => {
  let fullgame = {
    tour_name: "test-end-2",
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
        name: "pokemon",
        status: "in-pair",
        pair_id: 2,
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
            versus: "1,2",
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
            imp: 1,
            percent: 50,
          },
          {
            pair_id: 2,
            score: 0,
            direction: 1,
            imp: 1,
            percent: 20,
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
            imp: 1,
            percent: 80,
          },
          {
            pair_id: 2,
            score: 70,
            direction: 1,
            imp: 1,
            percent: 20,
          },
        ],
      },
    ],
    rankPairs: [
      {
        pair_id: 1,
        totalMP: 2,
        rankPercent: 80,
      },
      {
        pair_id: 2,
        totalMP: 1,
        rankPercent: 30,
      },
    ],
    status: "finished",
    createBy:"Mark1"
  };
  return fullgame;
};
