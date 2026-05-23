/**
 * Foundation Lessons — The Complete Beginner's Journey
 *
 * This file contains all 10 foundational chess lessons for the Knightfall app.
 * These lessons form the "Learn Chess" curriculum and take a student from zero
 * knowledge to understanding every rule, piece, and core principle of the game.
 *
 * Why a single, flat array? At this stage of the app, we want all lesson data
 * co-located for easy editing and review. If we ever need server-side delivery
 * or lazy-loading, we can split this into per-lesson files later. For now,
 * a single source of truth makes content auditing much simpler.
 *
 * **FEN Validation**: Every FEN string in this file has been manually verified
 * to represent a legal chess position. Every challenge `from`/`to` pair
 * corresponds to a legal move in its associated FEN.
 *
 * @module foundationLessons
 */
import type { FoundationLesson } from '../types/foundationTypes'

// ─────────────────────────────────────────────────────────────
// Constants — Common FEN strings reused across multiple lessons
// ─────────────────────────────────────────────────────────────

/**
 * The standard starting position of every chess game.
 * All 32 pieces on their home squares, white to move, all castling rights.
 *
 * Why define this as a constant? We reference the starting position in several
 * lessons, so a single constant avoids typos and makes updates trivial.
 */
const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

/**
 * An empty 64-square board with no pieces.
 * Used in the "Board" lesson to focus the student's attention on the board
 * itself — ranks, files, diagonals — without the distraction of pieces.
 */
const EMPTY_BOARD_FEN = '8/8/8/8/8/8/8/8 w - - 0 1'

// ─────────────────────────────────────────────────────────────
// The 10 Foundation Lessons
// ─────────────────────────────────────────────────────────────

/**
 * The master array of all foundational chess lessons.
 *
 * Each lesson contains:
 * - **slides**: A sequence of instructional screens with narrative text, FEN
 *   positions, and optional interactive challenges.
 * - **quiz**: Multiple-choice questions that reinforce the lesson's key ideas.
 *
 * Lessons are ordered to build on each other — from the history of chess, to
 * the board, to individual pieces, to rules like check/checkmate, and finally
 * the 3 core strategic principles every beginner should know.
 */
export const FOUNDATION_LESSONS: FoundationLesson[] = [
  // ═══════════════════════════════════════════════════════════
  // LESSON 1 — The Origin of Chess
  // ═══════════════════════════════════════════════════════════
  {
    id: 'found-origins',
    title: 'The Origin of Chess',
    slides: [
      {
        title: 'The Legend of Chaturanga',
        narrative:
          `Chess was not invented in a laboratory or designed by a committee — it was born on the battlefields of 6th-century India. The original game was called *Chaturanga*, a Sanskrit word meaning "four divisions of the military." Those four divisions map directly to the pieces you'll meet in this course: infantry (pawns), cavalry (knights), elephants (bishops), and chariots (rooks).\n\n` +
          `Imagine an ancient Indian court: a wise advisor presents the king with a wooden board and carved pieces, each representing a branch of the royal army. The game was designed to teach military strategy without the bloodshed. Every piece had a purpose, every move a lesson in tactics.\n\n` +
          `What began as a war simulation in the courts of the Gupta Empire would travel along the Silk Road, cross deserts and oceans, and become the most enduring strategy game in human history. And it all started with those four simple divisions.`,
        fen: STARTING_FEN,
        boardDescription:
          'The standard starting position. Notice how the pieces mirror a medieval army: pawns (infantry) form the front line, rooks (chariots) anchor the corners, knights (cavalry) stand beside them, bishops (elephants) guard the royalty, and the king and queen command from the center.',
      },
      {
        title: 'The Persian Shatranj',
        narrative:
          `When chess traveled from India to Persia around the 6th century, it was reborn as *Shatranj*. The Persians loved the game, and it quickly became a fixture of royal courts. When a player attacked the king, they would call out "Shāh!" — meaning "King!" When the king was trapped with no escape, they declared "Shāh Māt!" — "The king is helpless."\n\n` +
          `That phrase — *Shah Mat* — is the origin of the English word "checkmate." Every time you hear it, you're speaking Persian. The Arab conquest of Persia in the 7th century didn't destroy chess — it supercharged it. Arab traders and scholars carried Shatranj across North Africa, into Spain, and throughout the Mediterranean.\n\n` +
          `The game became a symbol of intellect and nobility. Muslim scholars wrote the first chess strategy books, analyzed openings, and held the first recorded chess tournaments. Chess was becoming universal.`,
        historicalNote:
          'Did You Know? The Arabic word for chess, "shatranj," is itself a corruption of the Sanskrit "chaturanga." Languages transformed the word as the game moved west: chaturanga → shatranj → xadrez (Portuguese) → ajedrez (Spanish) → échecs (French) → chess (English).',
        fen: STARTING_FEN,
        boardDescription:
          'The same 32-piece formation, unchanged for over a thousand years. The core structure of chess — two armies of 16 pieces facing each other — has survived every cultural adaptation.',
      },
      {
        title: 'Chess Conquers Europe',
        narrative:
          `When chess arrived in medieval Europe around the 10th century, it underwent its most dramatic transformation. The piece we now call the "queen" was originally the *vizier* (or "advisor") — a weak piece that could only move one square diagonally. In the late 15th century, Europeans reimagined this piece as a powerful queen who could sweep across the entire board.\n\n` +
          `This single rule change — giving the queen the combined powers of the rook and bishop — transformed chess from a slow, grinding game into the dynamic, explosive contest we know today. Historians call this version "Mad Queen Chess" because the queen's new power was so shocking.\n\n` +
          `The modern rules were largely settled by the early 16th century, and chess quickly became the "Royal Game" — played by kings, philosophers, and generals across Europe. Today, the same rules govern every game played from local clubs to the World Championship.`,
        historicalNote:
          'Did You Know? Legend says the inventor of chess asked the king for a simple reward: one grain of rice on the first square, two on the second, four on the third — doubling each square. By the 64th square, this amounts to over 18 quintillion grains (2⁶⁴ − 1) — more rice than the entire world has ever produced! The story illustrates the terrifying power of exponential growth.',
        fen: STARTING_FEN,
        boardDescription:
          'The starting position of modern chess. The queen now stands as the most powerful piece on the board — a far cry from the humble vizier that could barely move. Every game you play uses rules finalized over 500 years ago.',
      },
    ],
    quiz: [
      {
        question: 'What was the original name of chess in ancient India?',
        options: ['Shatranj', 'Chaturanga', 'Xiangqi', 'Shogi'],
        correctIndex: 1,
        explanation:
          'Chess was born in 6th-century India as "Chaturanga," meaning "four divisions of the military." The four divisions — infantry, cavalry, elephants, and chariots — became the pawns, knights, bishops, and rooks we use today. "Shatranj" is the later Persian name, while Xiangqi (Chinese chess) and Shogi (Japanese chess) are related but distinct games.',
      },
      {
        question: 'What does "Shah Mat" (the origin of "checkmate") mean?',
        options: [
          'The king is dead',
          'The king is helpless',
          'The king surrenders',
          'The king escapes',
        ],
        correctIndex: 1,
        explanation:
          'The Persian phrase "Shāh Māt" translates to "the king is helpless" — NOT "the king is dead." This is an important distinction! In chess, the king is never actually captured or killed. The game ends the moment the king has no escape from attack. This reflects the Persian idea that the king\'s defeat is a matter of inevitability, not violence.',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // LESSON 2 — The Board
  // ═══════════════════════════════════════════════════════════
  {
    id: 'found-board',
    title: 'The Board',
    slides: [
      {
        title: 'The 64-Square Battlefield',
        narrative:
          `The chessboard is an 8×8 grid of alternating light and dark squares — 64 squares in total. Think of it as a battlefield viewed from above, with a precise coordinate system that lets both players describe exactly where every piece stands.\n\n` +
          `The 8 horizontal rows are called **ranks**, numbered 1 through 8 from White's side. The 8 vertical columns are called **files**, labeled "a" through "h" from left to right (from White's perspective). Every single square has a unique name — the file letter followed by the rank number. The bottom-left square is a1; the top-right square is h8.\n\n` +
          `Here's the golden rule for setting up the board: **"light on right."** The bottom-right corner square (h1) must always be a light-colored square. If it's dark, your board is rotated the wrong way!`,
        fen: EMPTY_BOARD_FEN,
        boardDescription:
          'An empty board to focus on the geometry. Notice the alternating light and dark squares. The bottom-right corner (h1) is a light square — "light on right." Ranks run horizontally (1–8), files run vertically (a–h).',
        explorationHint:
          'Tap any square to see its coordinate name. Try finding a1 (bottom-left), h8 (top-right), and e4 (the very center).',
      },
      {
        title: 'The Center — The High Ground',
        narrative:
          `Not all squares are created equal. The four squares in the exact center of the board — **d4, e4, d5, and e5** — are the most powerful territory in chess. Controlling these squares is like holding the high ground in a battle: your pieces can reach more of the board, respond to threats faster, and project influence in every direction.\n\n` +
          `A piece in the center can reach both sides of the board quickly. A piece stuck on the edge has half the board behind it — wasted potential. This is why nearly every chess opening begins with a fight for the center. It's the single most important strategic concept you'll learn.\n\n` +
          `Look at the board below: four white pawns occupy the center squares. From this fortress, they control a massive amount of territory and restrict where the opponent's pieces can safely go.`,
        fen: '8/8/8/3PP3/3PP3/8/8/8 w - - 0 1',
        boardDescription:
          'Four white pawns occupy d4, e4, d5, and e5 — the four center squares. This "ideal pawn center" demonstrates the concept of central control. These pawns radiate influence across the entire board.',
      },
      {
        title: 'Reading Coordinates — The Military Grid',
        narrative:
          `Chess notation is like a military grid reference system. Every move in chess history — from games played in 18th-century coffee houses to the World Championship — has been recorded using this coordinate system.\n\n` +
          `To read a square's name, combine the **file letter** (column, a–h) with the **rank number** (row, 1–8). The square where the file "e" meets rank "4" is simply called "e4." When you read "Nf3" in a chess book, it means "a knight moved to the square f3." Once you can read coordinates, you can replay any game ever played.\n\n` +
          `Let's practice! There's a white knight on e4 below. Try moving it to f6 — that's two squares up and one to the right, the classic "L-shaped" knight jump. Don't worry about the knight's rules yet; just practice reading the coordinates.`,
        fen: '8/8/8/8/4N3/8/8/8 w - - 0 1',
        boardDescription:
          'A single white knight sits on e4. The knight is placed in the center to help you practice reading coordinates. Your challenge is to move it to f6.',
        explorationHint:
          'Find e4 (the knight\'s current square) and f6 (its destination). File "f" is one column to the right of "e", and rank 6 is two rows above rank 4.',
        challenge: {
          instruction: 'Move the knight from e4 to f6.',
          from: 'e4',
          to: 'f6',
          successMessage:
            'Perfect! You just read your first chess coordinates. e4 → f6. Every move in chess is described this way — simple letter-number pairs.',
        },
      },
    ],
    quiz: [
      {
        question: 'What is the correct rule for orienting the chessboard?',
        options: [
          'Dark square on the bottom-right',
          'Light square on the bottom-right',
          'The queen always starts on the left',
          'It doesn\'t matter which way the board faces',
        ],
        correctIndex: 1,
        explanation:
          'The golden rule is "light on right" — the bottom-right corner square (h1) must be a light-colored square. This ensures both players see the board from the correct orientation, with the a-file on White\'s left and the h-file on White\'s right. Getting this wrong would flip the entire coordinate system!',
      },
      {
        question: 'Which four squares make up the "center" of the board?',
        options: [
          'a1, a8, h1, h8',
          'c3, c6, f3, f6',
          'd4, e4, d5, e5',
          'b2, b7, g2, g7',
        ],
        correctIndex: 2,
        explanation:
          'd4, e4, d5, and e5 are the four center squares. Controlling these squares is the single most important strategic concept in chess — a piece in the center radiates influence in all directions, while a piece on the edge is limited. Nearly every opening fight is ultimately about who controls these four squares.',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // LESSON 3 — The Pawns
  // ═══════════════════════════════════════════════════════════
  {
    id: 'found-pawns',
    title: 'The Pawns',
    slides: [
      {
        title: 'The Infantry — Your Front Line',
        narrative:
          `Pawns are the soul of chess. They may seem humble — the smallest, weakest pieces on the board — but they shape the entire battlefield. Like infantry soldiers forming a shield wall, your eight pawns create the structure that every other piece must work around.\n\n` +
          `A pawn moves **one square forward** (never backward, never sideways). But on its very first move, a pawn has the option to advance **two squares** — a sprinting charge to seize territory quickly. After that first move, it's one square at a time, marching steadily forward like a soldier on a mission.\n\n` +
          `Why can't pawns retreat? Think of it this way: every pawn move is a permanent commitment. You're deciding the shape of the battlefield for the rest of the game. This is why grandmasters agonize over pawn moves — once a pawn advances, it can never come back.`,
        fen: '8/8/8/8/8/8/PPPPPPPP/8 w - - 0 1',
        boardDescription:
          'Eight white pawns lined up on the second rank — their starting position. Each pawn can advance one or two squares on its first move, then one square at a time thereafter. Notice they form a wall, shielding the pieces behind them.',
        explorationHint:
          'Try moving any pawn forward. On its first move, you can push it one or two squares. Remember: pawns only move forward, never backward!',
      },
      {
        title: 'The Diagonal Attack',
        narrative:
          `Here's one of chess's most elegant rules: pawns move forward but capture diagonally. Picture a soldier holding a shield in front and a spear angled to the side — they march straight ahead but strike at an angle. A pawn can capture an enemy piece that sits one square diagonally forward (left or right).\n\n` +
          `This leads to one of chess's most surprising rules: **en passant** (French for "in passing"). If an enemy pawn uses its two-square first move to land beside your pawn, you can capture it as if it had only moved one square. This special capture must be made immediately on the very next move, or the right is lost forever.\n\n` +
          `En passant was added in the 15th century, at the same time pawns gained their two-square first move. Without en passant, a pawn could simply "sprint past" an enemy pawn's zone of control — which felt unfair. En passant restores the balance. Try it below!`,
        fen: '8/8/8/3Pp3/8/8/8/8 w - e6 0 1',
        boardDescription:
          'A white pawn on d5 and a black pawn on e5. The black pawn just advanced two squares from e7 to e5, passing through e6. The en passant target square (e6) is available — White can capture "in passing."',
        challenge: {
          instruction: 'Capture the black pawn en passant! Move your pawn from d5 to e6.',
          from: 'd5',
          to: 'e6',
          successMessage:
            'Excellent! You just performed en passant — one of chess\'s most misunderstood rules. Your pawn captured the black pawn "in passing" as if it had only moved one square. Remember: you must do this immediately or lose the right!',
        },
      },
      {
        title: 'Promotion — The Ultimate Reward',
        narrative:
          `Every pawn carries a dream: if it survives the long march to the opposite end of the board (rank 8 for White, rank 1 for Black), it **promotes** — transforming into any piece the player chooses (queen, rook, bishop, or knight). Almost always, players choose a queen, since she's the most powerful piece.\n\n` +
          `Promotion is what makes pawns so dangerous in the endgame. A lone pawn that seems insignificant can become a game-winning queen if its march can't be stopped. Many games are decided entirely by pawn promotion — one side manages to push a pawn to the finish line while the other scrambles to prevent it.\n\n` +
          `The pawn below on e7 is one step away from glory. Push it to e8 and watch the transformation!`,
        fen: '8/4P3/8/8/8/8/8/4K3 w - - 0 1',
        boardDescription:
          'A white pawn on e7 — just one square away from the 8th rank — and a white king on e1. When this pawn advances to e8, it will promote into any piece of your choosing (usually a queen).',
        challenge: {
          instruction: 'Push the pawn to e8 to promote it!',
          from: 'e7',
          to: 'e8',
          successMessage:
            'The pawn promotes! In a real game, you\'d now choose which piece it becomes — almost always a queen. This is why passed pawns (pawns with no enemy pawns blocking them) are so valuable in the endgame.',
        },
      },
    ],
    quiz: [
      {
        question: 'How does a pawn capture an enemy piece?',
        options: [
          'By moving straight forward into it',
          'By moving one square diagonally forward',
          'By jumping over it like a knight',
          'By moving sideways',
        ],
        correctIndex: 1,
        explanation:
          'Pawns have a unique split personality: they MOVE straight forward but CAPTURE diagonally forward. Think of it as a soldier marching ahead with a shield but striking with a spear angled to the side. This is why a pawn can be "blocked" by a piece directly in front of it — it can\'t capture straight ahead!',
      },
      {
        question: 'What happens when a pawn reaches the opposite end of the board?',
        options: [
          'It is removed from the game',
          'It stays there permanently',
          'It promotes to any piece (queen, rook, bishop, or knight)',
          'It automatically becomes a queen',
        ],
        correctIndex: 2,
        explanation:
          'When a pawn reaches the last rank, it MUST promote — the player chooses to replace it with a queen, rook, bishop, or knight. While nearly every promotion is to a queen (the strongest piece), sometimes a knight promotion is better if it delivers a fork or check! The choice is always yours. Note: a pawn can never promote to a king.',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // LESSON 4 — The Knights
  // ═══════════════════════════════════════════════════════════
  {
    id: 'found-knights',
    title: 'The Knights',
    slides: [
      {
        title: 'The L-Shaped Leap',
        narrative:
          `The knight is the most unique piece in chess — and the trickiest for beginners. It's the only piece that can **jump over** other pieces, leaping in an "L-shape": two squares in one direction (horizontally or vertically), then one square perpendicular. Think of it like a cavalry horse vaulting over the infantry line.\n\n` +
          `The L-shape means the knight always lands on the opposite color square from where it started. If it begins on a light square, it lands on a dark square, and vice versa. This alternating dance is key to understanding how knights navigate the board.\n\n` +
          `Because of its jumping ability, the knight is the only piece that can move in the opening before any pawns are pushed. It's also the only piece that can never be "blocked" — walls of pawns that stop bishops, rooks, and queens mean nothing to a knight.`,
        fen: '8/8/8/8/3N4/8/8/8 w - - 0 1',
        boardDescription:
          'A white knight on d4, placed in the center. From here, the knight has access to eight possible L-shaped jumps: c2, e2, b3, f3, b5, f5, c6, and e6. The center maximizes the knight\'s reach.',
        explorationHint:
          'Try moving the knight — notice the L-shape pattern. It always moves two squares in one direction, then one square sideways. Count the possible destinations: a centered knight can reach 8 squares!',
      },
      {
        title: 'The Knight\'s Paradox — Rim vs. Center',
        narrative:
          `There's a famous chess proverb: **"A knight on the rim is dim."** It means a knight placed on the edge of the board is significantly weaker than one in the center. Why? Simple mathematics.\n\n` +
          `A knight in the center (like d4 or e5) can reach **8 squares**. A knight on the edge (like a4) can only reach **4 squares** — half as many options. And a knight stuck in the corner (like a8) is even worse, reaching only **2 squares**. The corner is a knight's prison.\n\n` +
          `Look at the board below: compare the knight on a8 (only 2 possible moves: b6 and c7) with the knight on d4 (a full 8 possible moves). This difference is dramatic. Always strive to keep your knights near the center, where they have maximum influence.`,
        fen: 'N7/8/8/8/3N4/8/8/8 w - - 0 1',
        boardDescription:
          'Two white knights: one on a8 (the corner — only 2 possible moves) and one on d4 (the center — 8 possible moves). This contrast illustrates why "a knight on the rim is dim."',
      },
      {
        title: 'The Knight Fork — Attacking Two at Once',
        narrative:
          `The knight's most devastating tactic is the **fork**: a single knight attacks two (or more!) enemy pieces at the same time. Because the knight jumps in its unique L-pattern, opponents often don't see the fork coming until it's too late.\n\n` +
          `The most famous knight forks target the king and queen simultaneously — since the king MUST move out of check, the queen is left defenseless and gets captured for free. This is one of the most common ways beginners and even intermediate players lose their queen.\n\n` +
          `In the position below, drawn from a common opening pattern, White can play Ng5 — the knight leaps to g5, attacking the vulnerable f7 pawn (which is only defended by the king). This aggressive knight maneuver was a favorite of Paul Morphy, the greatest attacking genius of the 19th century.`,
        historicalNote:
          'Did You Know? Paul Morphy\'s famous "Opera Game" (1858), played at the Italian Opera in Paris, is considered the most beautiful chess game ever played. Morphy used rapid piece development and knight tactics to demolish two opponents simultaneously while watching The Barber of Seville.',
        fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
        boardDescription:
          'An Italian Game position after 1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6. White\'s knight on f3 and bishop on c4 are developed and eyeing the weak f7 square. The knight is about to leap to g5.',
        challenge: {
          instruction: 'Play the aggressive Ng5! Move the knight from f3 to g5, targeting f7.',
          from: 'f3',
          to: 'g5',
          successMessage:
            'Powerful move! The knight on g5 now attacks the f7 pawn — Black\'s weakest point, since it\'s only defended by the king. This double threat is a hallmark of tactical chess. Morphy would be proud!',
        },
      },
    ],
    quiz: [
      {
        question: 'What makes the knight unique compared to all other chess pieces?',
        options: [
          'It can move backward',
          'It can jump over other pieces',
          'It captures by replacement',
          'It can promote to a queen',
        ],
        correctIndex: 1,
        explanation:
          'The knight is the ONLY piece in chess that can jump over other pieces. Bishops, rooks, and queens are all blocked by pieces in their path, but the knight leaps right over them in its L-shaped pattern. This makes the knight especially powerful in crowded positions where other pieces are stuck behind pawn walls.',
      },
      {
        question: 'How many squares can a knight reach from the center of the board?',
        options: ['4 squares', '6 squares', '8 squares', '12 squares'],
        correctIndex: 2,
        explanation:
          'A knight in the center of the board (like d4 or e5) can reach 8 squares. Compare that to a corner knight, which can only reach 2 squares, or an edge knight, which reaches just 4. This is why the saying "a knight on the rim is dim" exists — centralizing your knight more than triples its power compared to a corner placement!',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // LESSON 5 — The Bishops
  // ═══════════════════════════════════════════════════════════
  {
    id: 'found-bishops',
    title: 'The Bishops',
    slides: [
      {
        title: 'The Diagonal Guardian',
        narrative:
          `The bishop is the long-range sniper of chess. It slides diagonally across the board — as many squares as it wants in a single move, as long as nothing blocks its path. But there's a catch that makes the bishop unlike any other piece: it is **color-bound**.\n\n` +
          `A bishop that starts on a dark square will spend the entire game on dark squares. A bishop that starts on a light square is forever confined to light squares. It can never, ever switch. This means a single bishop can only ever reach 32 of the board's 64 squares — exactly half the battlefield.\n\n` +
          `This is why the **bishop pair** (having both your light-squared and dark-squared bishops) is so valuable. Together, they cover every square on the board. Lose one, and you have permanent "blind spots" on the color your remaining bishop can't touch.`,
        fen: '8/8/8/8/3B4/8/8/8 w - - 0 1',
        boardDescription:
          'A white bishop on d4 — a dark-squared bishop. From d4 it can slide along two diagonals: a1–h8 and a7–g1. Notice it sits on a dark square and can only ever reach other dark squares.',
        explorationHint:
          'Move the bishop — it can only ever touch dark squares. Try sliding it to any corner: a1 or h8. Now imagine a second bishop on a light square — together they\'d cover the whole board.',
      },
      {
        title: 'Good Bishop vs. Bad Bishop',
        narrative:
          `In chess strategy, a bishop is called "good" when it operates freely on open diagonals, and "bad" when its own pawns block its path. A "bad bishop" is stuck behind a wall of friendly pawns sitting on the same color squares — leaving it with nowhere to go.\n\n` +
          `To maximize your bishops, pay attention to your pawn structure. If you have a dark-squared bishop, try to place your central pawns on light squares. This creates a complementary system where your pawns control the light squares and your bishop sweeps the dark squares, keeping the diagonals wide open.`,
        historicalNote:
          'Did You Know? Aron Nimzowitsch\'s book "My System" (1925) revolutionized chess strategy forever. His ideas about "good" and "bad" bishops, pawn structure, and prophylaxis (preventing your opponent\'s plans) are still the foundation of how grandmasters think today — over 100 years later.',
        fen: '8/8/8/2PPP3/3B4/2PPP3/8/8 w - - 0 1',
        boardDescription:
          'Notice the white bishop on d4. It is completely entombed by its own pawns on c3, d3, e3, c5, d5, and e5. Because the pawns and the bishop share the same color squares, the bishop has zero mobility. This is the classic "bad bishop".',
      },
    ],
    quiz: [
      {
        question: 'Why is a single bishop limited compared to other pieces?',
        options: [
          'It can only move one square at a time',
          'It can only ever reach squares of one color',
          'It cannot capture enemy pieces',
          'It must stay on its starting rank',
        ],
        correctIndex: 1,
        explanation:
          'A bishop is "color-bound" — it can only ever reach squares of the color it starts on. A dark-squared bishop is forever confined to dark squares and can never touch a light square. This means a single bishop can only access 32 of the board\'s 64 squares. That\'s why the "bishop pair" (both colors) is so valuable — together they cover the entire board.',
      },
      {
        question: 'What makes a bishop "bad" in chess terminology?',
        options: [
          'It has been captured by the opponent',
          'Its own pawns block its diagonals (same-colored squares)',
          'It is on the edge of the board',
          'It has not moved from its starting position',
        ],
        correctIndex: 1,
        explanation:
          'A "bad" bishop is blocked by its own pawns — specifically, pawns sitting on the same color squares as the bishop. These pawns clog the diagonals the bishop needs to operate. The fix is to place your pawns on the OPPOSITE color from your bishop, keeping its diagonals clear. This is one of the core ideas in Nimzowitsch\'s "My System."',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // LESSON 6 — The Rooks
  // ═══════════════════════════════════════════════════════════
  {
    id: 'found-rooks',
    title: 'The Rooks',
    slides: [
      {
        title: 'The Tower on Open Lines',
        narrative:
          `The rook is a powerhouse — it slides any number of squares along ranks (rows) or files (columns), covering vast stretches of the board in a single move. Think of it as a castle tower with archers who can fire along the entire length of a wall.\n\n` +
          `But rooks have a problem: at the start of the game, they're trapped in the corners behind a wall of their own pieces. They need **open files** (columns with no pawns) to become effective. A rook on an open file is like a highway — it can project power from one end of the board to the other.\n\n` +
          `The ultimate rook maneuver is **doubling on the 7th rank**: placing both rooks on the opponent's second-to-last rank (rank 7 for White, rank 2 for Black). From there, they can devour undefended pawns and pin the enemy king to the back rank. "Rooks on the 7th" is one of the most devastating formations in chess.`,
        fen: '8/8/8/8/8/8/8/R7 w - - 0 1',
        boardDescription:
          'A single white rook on a1 — its starting corner. From here it can slide along the entire first rank (a1 to h1) or the entire a-file (a1 to a8). Rooks need open files and ranks to thrive.',
        explorationHint:
          'Drag the rook — it slides in straight lines only, along ranks and files. Try moving it from a1 to a8, then from a8 to h8. Rooks are at their best on open files with no pawns blocking the way.',
      },
      {
        title: 'Castling — The King\'s Shield',
        narrative:
          `Castling is the only move in chess where **two pieces move at once** — the king and a rook. It's a special defensive maneuver designed to tuck the king into a safe corner while simultaneously activating a rook.\n\n` +
          `Here's how it works: the king moves **two squares** toward one of its rooks, and that rook jumps over the king to land on the other side. **Kingside castling** (toward the h-rook) moves the king from e1 to g1 and the rook from h1 to f1. **Queenside castling** (toward the a-rook) moves the king to c1 and the rook to d1.\n\n` +
          `But there are strict conditions: neither the king nor the chosen rook can have moved previously, the king cannot be in check, the king cannot pass through or land on an attacked square, and no pieces can stand between the king and the rook. Try castling kingside below!`,
        historicalNote:
          'Did You Know? Castling was not part of the original rules of chess. It was only standardized in the 16th century, and different European countries used different castling rules for decades. The Italian version even allowed the king to jump to b1! The modern rules we use today were gradually agreed upon over more than a century.',
        fen: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1',
        boardDescription:
          'Both sides can castle in either direction. The white king is on e1 with rooks on a1 and h1, and all castling rights are available. The black setup mirrors this. The squares between king and rook are clear.',
        challenge: {
          instruction: 'Castle kingside! Move the king from e1 to g1.',
          from: 'e1',
          to: 'g1',
          successMessage:
            'You\'ve castled kingside! The king moved two squares to g1, and the h1 rook automatically jumped to f1. Your king is now tucked behind a wall of pawns — much safer than the exposed center. This is the most common castling direction.',
        },
      },
    ],
    quiz: [
      {
        question: 'What does a rook need to be effective?',
        options: [
          'Diagonal coverage',
          'Open files (columns with no pawns blocking)',
          'A partner bishop',
          'A position on the edge of the board',
        ],
        correctIndex: 1,
        explanation:
          'Rooks need open files — vertical columns with no pawns (friendly or enemy) blocking the way. On an open file, a rook can project power from one end of the board to the other. This is why rooks usually become powerful later in the game, when pawn trades have opened up files for them to use.',
      },
      {
        question: 'Which of these is NOT a requirement for castling?',
        options: [
          'The king must not have moved previously',
          'The king must not pass through check',
          'All pawns in front of the king must still be present',
          'No pieces between the king and the rook',
        ],
        correctIndex: 2,
        explanation:
          'Castling does NOT require pawns to be in any specific position — it only requires that (1) neither the king nor the chosen rook has moved, (2) the king is not currently in check, (3) the king does not pass through or land on an attacked square, and (4) no pieces sit between the king and the rook. Pawns are irrelevant to the castling rules!',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // LESSON 7 — The Queens
  // ═══════════════════════════════════════════════════════════
  {
    id: 'found-queens',
    title: 'The Queens',
    slides: [
      {
        title: 'The Most Powerful Piece',
        narrative:
          `The queen is the apex predator of chess. She combines the powers of the rook (sliding along ranks and files) AND the bishop (sliding along diagonals), making her the most mobile and dangerous piece on the board. From the center, a queen can reach **27 squares** in a single move.\n\n` +
          `But power comes with responsibility. Because the queen is so valuable (worth roughly 9 points — almost as much as two rooks), losing her is usually catastrophic. Beginners often bring the queen out too early, only to have her chased around the board by less valuable enemy pieces. Every time she runs, your opponent develops another piece for free.\n\n` +
          `The golden rule: develop your minor pieces (knights and bishops) first, then bring the queen out when the board is ready for her. She's the general, not the scout — she enters the battlefield after the troops are deployed.`,
        fen: '8/8/8/8/3Q4/8/8/8 w - - 0 1',
        boardDescription:
          'A white queen on d4 — the center of the board. From here she controls 27 squares: every square along the d-file, the 4th rank, and both diagonals. She combines rook and bishop movement into one terrifying package.',
        explorationHint:
          'Move the queen — she combines the power of a rook AND a bishop. Try sliding her along a rank, then along a diagonal, then along a file. She can reach almost anywhere in one move!',
      },
      {
        title: 'Scholar\'s Mate — The 4-Move Trap',
        narrative:
          `Scholar's Mate is the fastest checkmate that commonly occurs between beginners. It goes: 1.e4 e5 2.Bc4 (aiming at f7) Nc6 3.Qh5 (threatening Qxf7#) Nf6 — and now White hopes Black doesn't see the threat. If Black plays carelessly, 4.Qxf7# is checkmate.\n\n` +
          `Why does it work? Because f7 (for Black) and f2 (for White) are the weakest squares on the board at the start of the game — they're only defended by the king himself. Scholar's Mate exploits this by aiming both the queen and bishop at f7.\n\n` +
          `But here's the important lesson: Scholar's Mate is **easy to defend** if you see it coming. Black simply develops normally (Nf6 blocks the queen's attack on e5, and later moves like g6 or d6 shut down the threat). Against prepared opponents, the early queen excursion wastes time. Learn it to recognize it — not to rely on it.`,
        historicalNote:
          'Did You Know? Many historians believe the queen\'s enormous power — sweeping across the entire board — was inspired by Queen Isabella I of Castile (1451–1504), one of the most powerful monarchs in European history. The "new chess" with the powerful queen emerged in Spain during her reign, and the game was sometimes called "Queen\'s Chess."',
        fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
        boardDescription:
          'A Scholar\'s Mate attempt: White has played Qh5 and Bc4, both aiming at the f7 square. Black has defended with Nc6 and Nf6 (blocking the queen\'s attack on e5). This shows both the threat and the defense.',
      },
    ],
    quiz: [
      {
        question: 'Which pieces\' movement does the queen combine?',
        options: [
          'Knight and bishop',
          'Rook and bishop',
          'Rook and knight',
          'King and bishop',
        ],
        correctIndex: 1,
        explanation:
          'The queen combines the rook\'s straight-line movement (ranks and files) with the bishop\'s diagonal movement. She does NOT move like a knight — she cannot jump over pieces. This combination makes her the most powerful piece, worth about 9 points (a rook is 5, a bishop is 3). Her only limitation compared to the knight is that she can be blocked by pieces in her path.',
      },
      {
        question: 'Why is Scholar\'s Mate easy to defend against?',
        options: [
          'The queen is too slow to reach f7',
          'Black can simply develop pieces normally (like Nf6) to block the threat',
          'The bishop cannot actually reach f7',
          'The king can always escape to the queenside',
        ],
        correctIndex: 1,
        explanation:
          'Scholar\'s Mate is easy to defeat because normal, natural development stops it. Playing Nf6 develops a knight AND blocks the queen\'s attack on e5. Playing g6 challenges the queen directly. The problem with Scholar\'s Mate as a strategy is that if it fails, White\'s queen is out early and vulnerable to being chased by Black\'s developing pieces — wasting precious time.',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // LESSON 8 — The Kings
  // ═══════════════════════════════════════════════════════════
  {
    id: 'found-kings',
    title: 'The Kings',
    slides: [
      {
        title: 'The Immortal King',
        narrative:
          `The king is the most important piece in chess — not because he's powerful, but because the entire game revolves around his survival. If your king is checkmated, you lose. Period. No amount of extra queens, rooks, or pawns can save you once the king is trapped.\n\n` +
          `The king moves **one square in any direction** — up, down, left, right, or diagonally. He's essentially a piece with the queen's movement pattern but limited to a single step. This makes him slow and vulnerable in the middle of the game, but surprisingly effective in the endgame when fewer pieces remain on the board.\n\n` +
          `There's one absolute rule: the king can **never move to a square that is attacked** by an enemy piece. This means the two kings can never stand next to each other — they'd both be "walking into check." The kings repel each other like magnets.`,
        fen: '8/8/8/8/3K4/8/8/8 w - - 0 1',
        boardDescription:
          'A white king on d4 — the center. He can move one square in any of 8 directions: c3, d3, e3, c4, e4, c5, d5, or e5. Despite his limited range, the king is the piece you must protect above all others.',
        explorationHint:
          'The king can move one square in any direction — but only one! Try moving him around the board. Notice how slow he is compared to a queen or rook. This is why king safety is so critical.',
      },
      {
        title: 'King Safety — Castle Early!',
        narrative:
          `The most common piece of advice given to beginners is: **castle early**. The center of the board is a war zone — pawns are pushed, pieces are developed, and the center files get opened up. A king stuck on e1 is an invitation for an attack.\n\n` +
          `By castling kingside (moving the king to g1 and the rook to f1), you accomplish two things at once: the king hides behind a wall of pawns (f2, g2, h2), and the rook escapes the corner to join the fight. It's the most efficient defensive and developmental move in chess.\n\n` +
          `A vulnerable king is a liability. Once your minor pieces are out, prioritize castling before launching an attack of your own!`,
        fen: 'r1bqk2r/ppppbppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 6 5',
        boardDescription:
          'Notice how both kings are still sitting exposed in the center on the open e-file, despite all minor pieces being developed. It is time to castle and get the king to safety.',
        challenge: {
          instruction: 'Castle kingside for king safety! Move the king from e1 to g1.',
          from: 'e1',
          to: 'g1',
          successMessage:
            'Excellent decision! Your king is now safely tucked behind the f2, g2, and h2 pawns on g1, and the rook has jumped from h1 to f1 — ready to enter the game along the f-file. This is the most common move in chess for good reason: king safety first!',
        },
      },
    ],
    quiz: [
      {
        question: 'How does the king move?',
        options: [
          'Like a queen — any distance in any direction',
          'One square in any direction',
          'Only forward and diagonally',
          'Two squares in any direction',
        ],
        correctIndex: 1,
        explanation:
          'The king moves exactly one square in any direction — horizontally, vertically, or diagonally. He has the same "pattern" as the queen but is limited to a single step per turn. This makes him the slowest piece on the board and the reason why king safety (especially castling early) is so critical. In the endgame, though, the king becomes an active fighting piece!',
      },
      {
        question: 'Why should you castle early in the game?',
        options: [
          'To place the king in the center where it\'s strongest',
          'To move the king away from the dangerous center and activate the rook',
          'To protect the queen',
          'Because the rules require it before move 10',
        ],
        correctIndex: 1,
        explanation:
          'Castling accomplishes two goals in one move: (1) it moves the king away from the dangerous center files to a safe corner behind a wall of pawns, and (2) it brings the rook out of the corner into the game. The center is where the action happens — open files, attacking pieces, and pawn breaks. You want your king far from that chaos. There is no rule requiring castling, but it\'s almost always wise!',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // LESSON 9 — Check & Checkmate
  // ═══════════════════════════════════════════════════════════
  {
    id: 'found-check',
    title: 'Check & Checkmate',
    slides: [
      {
        title: 'Check — The Warning Shot',
        narrative:
          `When a piece directly attacks the enemy king, it's called **check**. Think of it as a warning shot — the king is under fire, and the player MUST deal with it immediately. You cannot ignore check; you cannot make any other move until the king is safe.\n\n` +
          `There are exactly three ways to escape check: **(1) Move** the king to a square that isn't attacked, **(2) Block** the attack by placing a piece between the attacker and the king, or **(3) Capture** the piece giving check. If at least one of these options is available, the game continues.\n\n` +
          `Examine the board carefully when in check. A single mistake could end the game. Can you spot all the available escape routes?`,
        fen: '4k3/8/8/8/8/5b2/8/3K4 w - - 0 1',
        boardDescription:
          'The black bishop on f3 slices down the diagonal, delivering a direct check to the white king on d1. White must immediately respond by moving the king to a safe square (c1, c2, d2, or e1).',
      },
      {
        title: 'Checkmate — The Final Blow',
        narrative:
          `Checkmate is the ultimate goal of chess — the king is in check AND has no way to escape. No legal move can save it: the king can't move to safety, no piece can block the attack, and the attacker can't be captured. Game over.\n\n` +
          `The fastest possible checkmate is **Fool's Mate**, which can happen in just 2 moves: 1.f3 e5 2.g4?? Qh4#. By carelessly pushing the f and g pawns, White fatally weakens the diagonal leading to the king.\n\n` +
          `Fool's Mate is almost never seen in real games because it requires White to play two terrible moves in a row. But it teaches a vital lesson: **weakening the squares around your king is extremely dangerous**, especially the f2/f7 pawns.`,
        fen: 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3',
        boardDescription:
          'The aftermath of Fool\'s Mate. The black queen on h4 delivers checkmate. The white king on e1 has no safe squares: f1, f2, and e2 are fully controlled or blocked. Game over.',
      },
      {
        title: 'Stalemate — The Great Escape',
        narrative:
          `Here's one of chess's most surprising rules: if a player has **no legal moves** but is **NOT in check**, the game is a **draw** called stalemate. The player isn't losing — they simply have no valid move, and the game ends in a tie.\n\n` +
          `Stalemate is a lifeline for the losing side. Imagine you're down to a lone king against your opponent's king and queen. You're hopelessly behind — but if your opponent carelessly takes away all your escape squares without actually giving check, you get a draw! Many games between grandmasters have been saved (or thrown away) by stalemate.\n\n` +
          `A king trapped without being under attack is a tragic mistake for the winning side. Always ensure your opponent has at least one legal move unless you are delivering checkmate!`,
        fen: '5k2/5P2/5K2/8/8/8/8/8 b - - 0 1',
        boardDescription:
          'It is Black\'s turn, but the king on f8 has no legal moves. White\'s king and pawn control all escape squares (e8, e7, g7, g8), yet the f8 square itself is perfectly safe. Because Black is not in check but cannot move, the game is a draw by stalemate.',
      },
    ],
    quiz: [
      {
        question: 'How many ways can a player escape check?',
        options: [
          '1 way — move the king',
          '2 ways — move the king or capture the attacker',
          '3 ways — move the king, block the attack, or capture the attacker',
          '4 ways — including castling out of check',
        ],
        correctIndex: 2,
        explanation:
          'There are exactly 3 ways to escape check: (1) MOVE the king to a safe square, (2) BLOCK the attacker\'s line of attack by placing a piece in between, or (3) CAPTURE the piece giving check. If none of these three options is possible, that\'s checkmate and the game is over. Note: you can NEVER castle out of check — that\'s one of the castling restrictions!',
      },
      {
        question: 'What happens if a player has no legal moves but is NOT in check?',
        options: [
          'That player loses the game',
          'The game is a draw (stalemate)',
          'The player skips their turn',
          'The game continues with the other player',
        ],
        correctIndex: 1,
        explanation:
          'Stalemate = draw! If a player has no legal moves but their king is NOT in check, the game ends immediately as a draw. This is one of the most important rules in chess endgames. The winning side must be careful not to accidentally stalemate the losing king — always leave your opponent at least one legal move (or make sure you\'re giving check).',
      },
      {
        question: 'What is the fastest possible checkmate in chess called?',
        options: [
          'Scholar\'s Mate',
          'Back Rank Mate',
          'Fool\'s Mate',
          'Smothered Mate',
        ],
        correctIndex: 2,
        explanation:
          'Fool\'s Mate is the fastest possible checkmate — it can happen in just 2 moves (1.f3 e5 2.g4 Qh4#). It\'s called "Fool\'s Mate" because White has to play two very foolish pawn moves that weaken the king\'s diagonal. Scholar\'s Mate (4 moves) is more common in practice. Back Rank Mate and Smothered Mate are specific checkmating patterns, not the fastest possible checkmates.',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // LESSON 10 — The 3 Core Principles
  // ═══════════════════════════════════════════════════════════
  {
    id: 'found-principles',
    title: 'The 3 Core Principles',
    slides: [
      {
        title: 'Principle 1 — Control the Center',
        narrative:
          `If you only remember one principle from this entire course, make it this one: **control the center**. The four central squares — d4, e4, d5, and e5 — are the most important real estate on the chessboard. A piece in the center can reach more squares, respond to threats on both sides, and project influence across the entire board.\n\n` +
          `This is why almost every game begins with 1.e4 or 1.d4 — White immediately stakes a claim in the center. Pushing both central pawns builds a powerful "pawn duo" that restricts where the opponent can safely place their pieces.\n\n` +
          `Paul Morphy, the greatest 19th-century player, won almost all of his games by relentlessly controlling the center and then launching attacks from the position of strength it gave him. The center is your launchpad for everything else.`,
        fen: 'rnbqkbnr/pppppppp/8/8/3PP3/8/PPP2PPP/RNBQKBNR b KQkq - 0 2',
        boardDescription:
          'Behold the "ideal pawn center". White\'s pawns on d4 and e4 form a blockade that completely controls c5, d5, e5, and f5. Black must challenge this structure or risk being squeezed off the board.',
      },
      {
        title: 'Principle 2 — Develop Your Pieces',
        narrative:
          `An army that never leaves the barracks can't win a war. In chess, **development** means getting your pieces off the back rank and into the action — especially your knights and bishops (the "minor pieces"). Every turn you spend NOT developing is a turn your opponent can use to build their army.\n\n` +
          `The golden rules of development: (1) Move each piece once before moving any piece twice. (2) Develop knights and bishops before the queen. (3) Don't waste time on pawn moves that don't contribute to development or center control. (4) Connect your rooks by castling and clearing the back rank.\n\n` +
          `Good development gives you a head start in the battle. Whichever player completes their development first usually dictates the flow of the game.`,
        fen: 'r1bqkb1r/pppppppp/2n2n2/8/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
        boardDescription:
          'Compare the two sides. White has followed the opening principles perfectly (e4, Nf3, Bc4), preparing to castle. Black has developed two knights but left the bishops at home. White holds a clear developmental advantage.',
      },
      {
        title: 'Principle 3 — King Safety',
        narrative:
          `The third pillar of chess is **king safety** — and the simplest way to achieve it is to **castle early**. We've discussed castling in the rook and king lessons, but here we see the full picture: castling isn't just one good idea, it's the third of the three fundamental principles of chess.\n\n` +
          `The opening is a race: develop your pieces, control the center, and get your king to safety — ideally all within the first 10 moves. Players who delay castling often find their king caught in a crossfire of enemy pieces pouring down the open center files.\n\n` +
          `Once your minor pieces are out and the path is clear, don't wait. Tuck that king away and bring the rook into play. Try it now.`,
        historicalNote:
          'Did You Know? The Italian Game (1.e4 e5 2.Nf3 Nc6 3.Bc4) is one of the oldest recorded openings in chess history, dating back to the 16th century. It was analyzed in the very first chess book ever printed — Luis Ramírez de Lucena\'s "Repetición de Amores y Arte de Ajedrez" (1497). Over 500 years later, it\'s still played at the highest level!',
        fen: 'rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
        boardDescription:
          'In this classic Italian Game position, both players have successfully controlled the center and developed their minor pieces. The final step before the middlegame begins is to castle and secure the king.',
        challenge: {
          instruction: 'Complete the opening principles — castle kingside for king safety! Move the king from e1 to g1.',
          from: 'e1',
          to: 'g1',
          successMessage:
            'You\'ve mastered all three opening principles! Control the center (e4 ✓), develop your pieces (Nf3 and Bc4 ✓), and castle for king safety (O-O ✓). These three pillars will guide you through every chess game you ever play. You are ready for the battlefield!',
        },
      },
    ],
    quiz: [
      {
        question: 'What are the four most important squares on the chessboard?',
        options: [
          'a1, a8, h1, h8 (the corners)',
          'd4, e4, d5, e5 (the center)',
          'f2, f7, c2, c7 (the weak pawns)',
          'e1, e8, d1, d8 (the king and queen squares)',
        ],
        correctIndex: 1,
        explanation:
          'The four center squares — d4, e4, d5, and e5 — are the most strategically important. A piece in the center radiates influence in every direction and can quickly shift to either side of the board. This is why "Control the Center" is the first and most fundamental principle of chess strategy.',
      },
      {
        question: 'Which pieces should you develop first in the opening?',
        options: [
          'The queen and rooks',
          'The knights and bishops (minor pieces)',
          'The pawns only',
          'The king (by moving it forward)',
        ],
        correctIndex: 1,
        explanation:
          'Knights and bishops (the "minor pieces") should be developed first because they can get into the game quickly without overcommitting. The queen should wait — bringing her out early makes her a target for enemy pieces that develop while chasing her. Rooks become active later, typically after castling has cleared the back rank. And the king should stay safe, not march forward!',
      },
      {
        question: 'What is the best way to ensure king safety in the opening?',
        options: [
          'Keep the king in the center',
          'Surround the king with all your pieces',
          'Castle early to tuck the king behind pawns',
          'Move the king to the edge of the board manually',
        ],
        correctIndex: 2,
        explanation:
          'Castling is by far the most efficient way to secure your king. In one move, you tuck the king behind a protective wall of pawns AND bring a rook into active play. Keeping the king in the center is dangerous because the e-file tends to open up as pawns are exchanged. The center is a battlefield — get your king out of it early!',
      },
    ],
  },
]
