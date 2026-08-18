import { Hunt, HuntSecrets } from "./types";

export const ICAT_2026_HUNT_ID = "icat-2026";

export const ICAT_2026_HUNT_DATA: Hunt = {
  id: ICAT_2026_HUNT_ID,
  name: "ICAT Bangalore Treasure Hunt 2026",
  slug: "icat-2026",
  status: "active",
  theme: "cyberpunk-vault",
  startingNodeId: "202",
  totalFloors: 5,
  floors: [
    {
      id: "floor-1",
      floorNumber: 1,
      name: "Floor 1 - Ground Level (Reception, Labs, Canteen & Audi)",
      shortName: "FL 1",
      nodeIds: ["Reception", "Audi", "Canteen", "Textile Lab", "Photo Lab"],
    },
    {
      id: "floor-2",
      floorNumber: 2,
      name: "Floor 2 - Digital Labs & Vice Principal Cabin",
      shortName: "FL 2",
      nodeIds: ["202", "201", "206", "Vice principal cabin"],
    },
    {
      id: "floor-3",
      floorNumber: 3,
      name: "Floor 3 - Studios, Library & Staff Lunch",
      shortName: "FL 3",
      nodeIds: ["305", "306", "Library", "Staff Lunch"],
    },
    {
      id: "floor-4",
      floorNumber: 4,
      name: "Floor 4 - Mainframes, Audio & Staff Room",
      shortName: "FL 4",
      nodeIds: ["401A", "401B", "402", "Staff room"],
    },
    {
      id: "floor-5",
      floorNumber: 5,
      name: "Floor 5 - Visual Arts, Fashion Lab & Game Lounge",
      shortName: "FL 5",
      nodeIds: ["503", "Game Lounge", "F.L."],
    },
  ],
  teams: {
    RED: {
      id: "RED",
      name: "Red Squadron",
      color: "red",
      hex: "#FF2A55",
      routeId: "P1",
      badge: "◈",
    },
    WHITE: {
      id: "WHITE",
      name: "White Phantoms",
      color: "white",
      hex: "#E2E8F0",
      routeId: "P2",
      badge: "◇",
    },
    BLACK: {
      id: "BLACK",
      name: "Black Ops",
      color: "black",
      hex: "#64748B",
      routeId: "P3",
      badge: "◆",
    },
    CYAN: {
      id: "CYAN",
      name: "Cyan Cyber",
      color: "cyan",
      hex: "#00F0FF",
      routeId: "P1",
      badge: "❖",
    },
    BLUE: {
      id: "BLUE",
      name: "Blue Sentinels",
      color: "blue",
      hex: "#3B82F6",
      routeId: "P2",
      badge: "⬡",
    },
  },
  routes: {
    P1: {
      id: "P1",
      name: "Route Alpha (P1)",
      nodes: [
        "202",
        "Vice principal cabin",
        "401B",
        "Staff room",
        "306",
        "Staff Lunch",
        "Game Lounge",
        "Textile Lab",
        "401A",
        "F.L.",
        "201",
        "Audi",
      ],
    },
    P2: {
      id: "P2",
      name: "Route Beta (P2)",
      nodes: [
        "202",
        "Game Lounge",
        "503",
        "Staff Lunch",
        "305",
        "Staff room",
        "402",
        "Reception",
        "401A",
        "Canteen",
        "Library",
        "Audi",
      ],
    },
    P3: {
      id: "P3",
      name: "Route Gamma (P3)",
      nodes: [
        "202",
        "Photo Lab",
        "Staff room",
        "306",
        "Library",
        "503",
        "305",
        "Staff Lunch",
        "401A",
        "206",
        "Reception",
        "Audi",
      ],
    },
  },
  nodes: {
    // STAGE 1: Starting Room 202 (NO PUZZLE PIECE)
    "202": {
      id: "202",
      name: "202",
      floorId: "floor-2",
      type: "NORMAL",
      position: { x: 35, y: 40 },
      riddle: {
        title: "Starting Point: Genesis Station",
        text: "You are standing at Room 202. Present your launch credentials to the room invigilator to verify squad registration, receive your launch cipher, and unlock your first destination!",
        hint: "Locate the invigilator inside Room 202 to obtain your squad launch cipher.",
      },
      codeSource: "TEACHER",
      nextNodes: ["Vice principal cabin", "Game Lounge", "Photo Lab"],
      // NO PUZZLE PIECE AT STARTING NODE
    },

    // 20 CAMPUS ROOMS WITH ROUTE-SPECIFIC RIDDLES AND 6 PIECES (STAGES 2-7)
    "Vice principal cabin": {
      id: "Vice principal cabin",
      name: "Vice principal cabin",
      floorId: "floor-2",
      type: "NORMAL",
      position: { x: 75, y: 35 },
      riddle: {
        title: "The Executive Sanctum",
        text: "Where campus leadership charters are reviewed and executive guidance convenes. Present your squad status respectfully to the cabin executive for your next route cipher.",
        hint: "Floor 2 Vice Principal Cabin. Ask the executive for the clearance cipher.",
      },
      routePuzzleLocations: {
        P1: {
          clue: "Physical Fragment 1 is cached near the entrance directory plaque of the Vice Principal Cabin.",
          hint: "Beside the executive plaque.",
          pieceId: "PIECE_1",
        },
      },
      codeSource: "TEACHER",
      nextNodes: ["401B"],
    },

    "401B": {
      id: "401B",
      name: "401B",
      floorId: "floor-4",
      type: "NORMAL",
      position: { x: 70, y: 55 },
      riddle: {
        title: "Virtual Reality Bay",
        text: "Where headsets simulate distant dimensions and tracking sensors hum. Scour the room for a hidden cipher token near the VR sensor stands.",
        hint: "Floor 4, Room 401B. Inspect the VR headset staging table.",
      },
      routePuzzleLocations: {
        P1: {
          clue: "Physical Fragment 2 is taped under the primary VR tracking stand in Room 401B.",
          hint: "Right support strut.",
          pieceId: "PIECE_2",
        },
      },
      codeSource: "HIDDEN",
      nextNodes: ["Staff room"],
    },

    "Staff room": {
      id: "Staff room",
      name: "Staff room",
      floorId: "floor-4",
      type: "NORMAL",
      position: { x: 30, y: 45 },
      riddle: {
        title: "Staff Room Nexus",
        text: "Where instructors coordinate academic schedules between lecture hours. Search discreetly near the central faculty notice board for the cipher token.",
        hint: "Floor 4 Staff Room. Check near the faculty schedule board.",
      },
      routeRiddles: {
        P1: {
          title: "The Faculty Headquarters (P1)",
          text: "Instructors chart academic tracks here. Locate the hidden cipher token near the central notice board to unlock Stage #4.",
          hint: "Floor 4 Staff Room notice board.",
        },
        P2: {
          title: "The Academic Nexus (P2)",
          text: "Where faculty lesson plans align. Search near the central reference desk for your squad cipher to unlock Stage #6.",
          hint: "Floor 4 Staff Room central desk.",
        },
        P3: {
          title: "The Instructor Hub (P3)",
          text: "Between classrooms, teachers prepare schedules here. Search near the faculty pigeonholes for the cipher to unlock Stage #3.",
          hint: "Floor 4 Staff Room mailboxes.",
        },
      },
      routePuzzleLocations: {
        P1: {
          clue: "Physical Fragment 3 is secured near the faculty schedule board in Staff Room.",
          hint: "Lower shelf.",
          pieceId: "PIECE_3",
        },
        P2: {
          clue: "Physical Fragment 5 is cached behind the faculty schedule board in Staff Room.",
          hint: "Lower shelf.",
          pieceId: "PIECE_5",
        },
        P3: {
          clue: "Physical Fragment 2 is secured near the faculty reference desk in Staff Room.",
          hint: "Lower shelf.",
          pieceId: "PIECE_2",
        },
      },
      codeSource: "HIDDEN",
      nextNodes: ["306", "402"],
    },

    "306": {
      id: "306",
      name: "306",
      floorId: "floor-3",
      type: "NORMAL",
      position: { x: 75, y: 45 },
      riddle: {
        title: "Interface Architecture (Room 306)",
        text: "Where wireframes transform into digital interactions and user flows. Request clearance from the lab coordinator in Room 306.",
        hint: "Floor 3, Room 306. Inquire with the lab supervisor.",
      },
      routeRiddles: {
        P1: {
          title: "Interface Architecture (P1)",
          text: "Wireframes and prototypes align on interactive screens. Inquire with the lab supervisor in Room 306 for your P1 clearance cipher.",
          hint: "Floor 3, Room 306. Ask the supervisor.",
        },
        P3: {
          title: "UX Design Studio (P3)",
          text: "Where digital user journeys are architected. Ask the faculty in Room 306 for your P3 clearance cipher.",
          hint: "Floor 3, Room 306. Inquire with faculty.",
        },
      },
      routePuzzleLocations: {
        P1: {
          clue: "Physical Fragment 4 is placed behind the UI design whiteboard in Room 306.",
          hint: "Behind the marker tray.",
          pieceId: "PIECE_4",
        },
        P3: {
          clue: "Physical Fragment 3 is placed behind the UI design whiteboard in Room 306.",
          hint: "Behind the marker tray.",
          pieceId: "PIECE_3",
        },
      },
      codeSource: "TEACHER",
      nextNodes: ["Staff Lunch"],
    },

    "Staff Lunch": {
      id: "Staff Lunch",
      name: "Staff Lunch",
      floorId: "floor-3",
      type: "NORMAL",
      position: { x: 50, y: 70 },
      riddle: {
        title: "The Refreshment Outpost",
        text: "Where faculties recharge between lectures over coffee and meals. A hidden cipher is discreetly placed near the refreshment counter.",
        hint: "Floor 3 Staff Lunch Room. Search the refreshment shelf.",
      },
      routeRiddles: {
        P1: {
          title: "The Refreshment Outpost (P1)",
          text: "Where coffee brews and faculties recharge. Search near the refreshment counter for your P1 cipher token.",
          hint: "Floor 3 Staff Lunch Room.",
        },
        P2: {
          title: "The Pantry Outpost (P2)",
          text: "Where mid-day meals and hot tea are served. A cipher token is hidden near the corner utility counter.",
          hint: "Floor 3 Staff Lunch Room corner counter.",
        },
        P3: {
          title: "The Tea Haven (P3 - Stage 8)",
          text: "Where faculties take a well-deserved break. Search near the dining counter for your route cipher. (Pure riddle stage - all pieces collected!)",
          hint: "Floor 3 Staff Lunch Room dining table.",
        },
      },
      routePuzzleLocations: {
        P1: {
          clue: "Physical Fragment 5 is taped under the side utility counter in Staff Lunch Room.",
          hint: "Underneath the corner counter.",
          pieceId: "PIECE_5",
        },
        P2: {
          clue: "Physical Fragment 3 is taped under the side utility counter in Staff Lunch Room.",
          hint: "Underneath the corner counter.",
          pieceId: "PIECE_3",
        },
        // P3 visits Staff Lunch at Stage 8 -> NO PUZZLE PIECE (All 6 already collected!)
      },
      codeSource: "HIDDEN",
      nextNodes: ["Game Lounge", "305", "401A"],
    },

    "Game Lounge": {
      id: "Game Lounge",
      name: "Game Lounge",
      floorId: "floor-5",
      type: "NORMAL",
      position: { x: 25, y: 45 },
      riddle: {
        title: "The Gamer's Haven",
        text: "Where controllers click and high scores reign supreme. Check near the console display stations for your squad cipher.",
        hint: "Floor 5 Game Lounge. Inspect the arcade console shelf.",
      },
      routeRiddles: {
        P1: {
          title: "Arcade Outpost (P1 - Stage 7)",
          text: "Where gaming consoles glow in dim light. Inspect the retro arcade TV cabinet for your final physical fragment cipher!",
          hint: "Floor 5 Game Lounge arcade station.",
        },
        P2: {
          title: "The Gamer's Haven (P2 - Stage 2)",
          text: "Where high scores and esports legends train. Check near the console shelf for your P2 cipher token.",
          hint: "Floor 5 Game Lounge console shelf.",
        },
      },
      routePuzzleLocations: {
        P1: {
          clue: "Physical Fragment 6 (FINAL PIECE) is concealed behind the retro console display in Game Lounge.",
          hint: "Beside the arcade TV cabinet.",
          pieceId: "PIECE_6",
        },
        P2: {
          clue: "Physical Fragment 1 is concealed behind the retro console display in Game Lounge.",
          hint: "Beside the arcade TV cabinet.",
          pieceId: "PIECE_1",
        },
      },
      codeSource: "HIDDEN",
      nextNodes: ["Textile Lab", "503"],
    },

    // STAGES 8-12: PURE RIDDLES & BOSS (NO PUZZLE PIECES)
    "Textile Lab": {
      id: "Textile Lab",
      name: "Textile Lab",
      floorId: "floor-1",
      type: "NORMAL",
      position: { x: 75, y: 35 },
      riddle: {
        title: "The Loom of Patterns (Stage 8 - No Pieces)",
        text: "Threads of fabric and weave align on cutting tables. Inquire with the textile studio supervisor for the Boss Access Cipher.",
        hint: "Floor 1 Textile Lab. Present your squad status to receive the Boss clearance cipher.",
      },
      codeSource: "TEACHER",
      nextNodes: ["401A"],
      // NO PIECE (Stage 8)
    },

    "401A": {
      id: "401A",
      name: "401A",
      floorId: "floor-4",
      type: "BOSS",
      position: { x: 50, y: 25 },
      riddle: {
        title: "BOSS GATEWAY: Sector 401A Unity Mainframe",
        text: "WARNING: High-security cyber defense active! Travel to Room 401A. The Unity Arcade Challenge Station is loaded on the workstation. Achieve >= 850 PTS in the Unity game to receive your clearance cipher and unlock your post-boss route stages!",
        hint: "Play the Unity Arcade Game in Room 401A. Score >= 850 PTS to unlock the secret cipher to decrypt this sector and unlock your next route nodes!",
      },
      codeSource: "MINIGAME",
      nextNodes: ["F.L.", "Canteen", "206"],
      minigame: {
        gameId: "401A_UNITY_OVERRIDE",
        minimumScore: 850,
        title: "Unity Cyber Mainframe Override",
        instructions: "Play the Unity game in Room 401A or online. Achieve >= 850 PTS to decrypt your squad clearance cipher.",
      },
      // NO PIECE
    },

    "F.L.": {
      id: "F.L.",
      name: "F.L.",
      floorId: "floor-5",
      type: "NORMAL",
      position: { x: 70, y: 45 },
      riddle: {
        title: "Fashion & Film Lab (F.L. - Stage 10)",
        text: "Where mannequins, couture patterns and cameras capture form. Search near the master drafting table for your post-boss cipher.",
        hint: "Floor 5 Fashion Lab (F.L.). Check the pattern drafting table.",
      },
      codeSource: "HIDDEN",
      nextNodes: ["201"],
      // NO PIECE
    },

    "201": {
      id: "201",
      name: "201",
      floorId: "floor-2",
      type: "NORMAL",
      position: { x: 25, y: 40 },
      riddle: {
        title: "Foundation Atelier (Room 201 - Penultimate Stage)",
        text: "Where line, perspective and shading begin. Ask the foundation instructor for the penultimate clearance cipher before the Grand Vault.",
        hint: "Floor 2, Room 201. Inquire with the studio supervisor.",
      },
      codeSource: "TEACHER",
      nextNodes: ["Audi"],
      // NO PIECE
    },

    "503": {
      id: "503",
      name: "503",
      floorId: "floor-5",
      type: "NORMAL",
      position: { x: 50, y: 65 },
      riddle: {
        title: "The High Art Gallery (Room 503)",
        text: "Ascend to Floor 5 where digital canvases glow. Speak with the studio instructor for your route clearance cipher.",
        hint: "Floor 5, Room 503. Request clearance from instructor.",
      },
      routeRiddles: {
        P2: {
          title: "Visual Arts Gallery (P2 - Stage 3)",
          text: "Where digital brushstrokes render upon tablets. Request your P2 clearance from the studio instructor.",
          hint: "Floor 5, Room 503. Inquire with instructor.",
        },
        P3: {
          title: "The Digital Canvas (P3 - Stage 6)",
          text: "Ascend to Floor 5 where concept paintings line the walls. Ask the instructor for your P3 clearance cipher.",
          hint: "Floor 5, Room 503. Inquire with instructor.",
        },
      },
      routePuzzleLocations: {
        P2: {
          clue: "Physical Fragment 2 is placed behind the gallery easel in Room 503.",
          hint: "Mounted near display rail.",
          pieceId: "PIECE_2",
        },
        P3: {
          clue: "Physical Fragment 5 is placed behind the gallery easel in Room 503.",
          hint: "Mounted near display rail.",
          pieceId: "PIECE_5",
        },
      },
      codeSource: "TEACHER",
      nextNodes: ["Staff Lunch", "305"],
    },

    "305": {
      id: "305",
      name: "305",
      floorId: "floor-3",
      type: "NORMAL",
      position: { x: 25, y: 45 },
      riddle: {
        title: "Rapid Prototyping Workshop (Room 305)",
        text: "Where molten strands build physical models. A cipher is concealed near the 3D printers.",
        hint: "Floor 3, Room 305. Check under the 3D printer table.",
      },
      routeRiddles: {
        P2: {
          title: "3D Fabrication Workshop (P2 - Stage 5)",
          text: "Where nozzles heat and 3D filaments build structures. Locate the P2 cipher token near the printer station.",
          hint: "Floor 3, Room 305 printer table.",
        },
        P3: {
          title: "Rapid Prototyping Bay (P3 - Stage 7)",
          text: "Where physical models cure and harden. Search the storage bay for your final physical fragment cipher!",
          hint: "Floor 3, Room 305 filament bin.",
        },
      },
      routePuzzleLocations: {
        P2: {
          clue: "Physical Fragment 4 is cached inside the storage bin under the 3D printer table in Room 305.",
          hint: "Blue filament box.",
          pieceId: "PIECE_4",
        },
        P3: {
          clue: "Physical Fragment 6 (FINAL PIECE) is cached inside the storage bin under the 3D printer table in Room 305.",
          hint: "Blue filament box.",
          pieceId: "PIECE_6",
        },
      },
      codeSource: "HIDDEN",
      nextNodes: ["Staff room", "Staff Lunch"],
    },

    "402": {
      id: "402",
      name: "402",
      floorId: "floor-4",
      type: "NORMAL",
      position: { x: 80, y: 25 },
      riddle: {
        title: "Sound Synthesis Bay (Room 402 - Stage 7)",
        text: "Audio waves and synthesized beats are mixed here. Locate the hidden cipher token on the mixer console for your final physical fragment!",
        hint: "Floor 4, Room 402. Check the audio mixer console.",
      },
      routePuzzleLocations: {
        P2: {
          clue: "Physical Fragment 6 (FINAL PIECE) is taped under the audio monitor stand in Room 402.",
          hint: "Right acoustic baffle.",
          pieceId: "PIECE_6",
        },
      },
      codeSource: "HIDDEN",
      nextNodes: ["Reception"],
    },

    "Library": {
      id: "Library",
      name: "Library",
      floorId: "floor-3",
      type: "NORMAL",
      position: { x: 50, y: 25 },
      riddle: {
        title: "Campus Library",
        text: "Shelves of volumes stand in silent rows. Inquire with the librarian at the circulation desk for your clearance cipher.",
        hint: "Floor 3 Library. Ask the librarian for the book cipher.",
      },
      routeRiddles: {
        P2: {
          title: "The Silent Stacks (P2 - Stage 11)",
          text: "Rows of research compendiums stand silent. Inquire with the librarian for the penultimate P2 cipher before the Grand Vault.",
          hint: "Floor 3 Library circulation desk.",
        },
        P3: {
          title: "The Repository of Knowledge (P3 - Stage 5)",
          text: "Where historical archives and game design volumes are kept. Inquire with the librarian for your P3 cipher.",
          hint: "Floor 3 Library circulation desk.",
        },
      },
      routePuzzleLocations: {
        P3: {
          clue: "Physical Fragment 4 is placed inside the reference book catalog in the Library.",
          hint: "Behind section 700.",
          pieceId: "PIECE_4",
        },
        // P2 visits Library at Stage 11 -> NO PUZZLE PIECE (All 6 already collected!)
      },
      codeSource: "TEACHER",
      nextNodes: ["Audi", "503"],
    },

    "Canteen": {
      id: "Canteen",
      name: "Canteen",
      floorId: "floor-1",
      type: "NORMAL",
      position: { x: 25, y: 70 },
      riddle: {
        title: "Campus Canteen (Stage 10 - No Pieces)",
        text: "Where students gather for lunch and conversation. Scour near the central seating area for your post-boss route cipher.",
        hint: "Floor 1 Canteen. Search near the central seating area.",
      },
      codeSource: "HIDDEN",
      nextNodes: ["Library"],
      // NO PIECE (Stage 10)
    },

    "Reception": {
      id: "Reception",
      name: "Reception",
      floorId: "floor-1",
      type: "NORMAL",
      position: { x: 50, y: 70 },
      riddle: {
        title: "Campus Reception",
        text: "Where visitors enter the campus perimeter. Check in with the front desk officer for your clearance cipher.",
        hint: "Floor 1 Reception. Speak with the front desk executive.",
      },
      routeRiddles: {
        P2: {
          title: "The Front Gate (P2 - Stage 8)",
          text: "The main campus gateway. Check in with the front desk officer for your pre-boss cipher token.",
          hint: "Floor 1 Reception.",
        },
        P3: {
          title: "The Ground Gateway (P3 - Stage 11)",
          text: "The main campus arrival desk. Check in with the front desk officer for the penultimate cipher before the Grand Vault.",
          hint: "Floor 1 Reception.",
        },
      },
      codeSource: "TEACHER",
      nextNodes: ["401A", "Audi"],
      // NO PIECE (Stage 8 on P2, Stage 11 on P3)
    },

    "Photo Lab": {
      id: "Photo Lab",
      name: "Photo Lab",
      floorId: "floor-1",
      type: "NORMAL",
      position: { x: 25, y: 35 },
      riddle: {
        title: "Photo Lab Studio (P3 - Stage 2)",
        text: "Where shutter speed captures frozen time. Search near the tripod storage bay in the Photo Lab for your first physical fragment cipher!",
        hint: "Floor 1 Photo Lab. Search the lighting tripod rack.",
      },
      routePuzzleLocations: {
        P3: {
          clue: "Physical Fragment 1 is taped beneath the backdrop roll in Photo Lab.",
          hint: "Lower bracket.",
          pieceId: "PIECE_1",
        },
      },
      codeSource: "HIDDEN",
      nextNodes: ["Staff room"],
    },

    "206": {
      id: "206",
      name: "206",
      floorId: "floor-2",
      type: "NORMAL",
      position: { x: 50, y: 70 },
      riddle: {
        title: "Room 206 CG Lab (P3 - Stage 10)",
        text: "Where textures and shading render in full resolution. Locate the cipher token on the peripheral shelf.",
        hint: "Floor 2, Room 206. Check near the graphics tablet storage.",
      },
      codeSource: "HIDDEN",
      nextNodes: ["Reception"],
      // NO PIECE (Stage 10)
    },

    // STAGE 12: FINAL GRAND TREASURE VAULT (NO PIECE - ASSEMBLE ALL 6 FRAGMENTS)
    "Audi": {
      id: "Audi",
      name: "Audi",
      floorId: "floor-1",
      type: "FINAL",
      position: { x: 50, y: 20 },
      riddle: {
        title: "FINAL DESTINATION: Campus Auditorium",
        text: "All paths converge at the Grand Auditorium! Assemble all 6 physical puzzle pieces retrieved across campus to reveal the ultimate victory key and claim the ICAT 2026 Grand Trophy!",
        hint: "Enter the Auditorium on Floor 1. Present all 6 assembled physical puzzle pieces to the Grand Arbiter on stage and submit the ultimate victory cipher.",
      },
      codeSource: "HIDDEN",
      nextNodes: [],
      // NO PUZZLE PIECE (Assemble all 6 pieces to win!)
    },
  },
  treasure: {
    title: "THE ICAT CYBER VAULT OF 2026",
    clue: "All 6 fragments unite to expose the hidden relic. The true treasure lies in the collaborative synergy of your squad!",
    hint: "Present your 6 assembled physical pieces to the Event Director at the Ground Floor Auditorium to claim the Grand Trophy.",
    finalMessage: "MISSION ACCOMPLISHED: Squad cleared all sectors, collected all 6 physical fragments, breached Sector 401A, and unlocked the Master Vault in the Auditorium!",
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

// Route-Specific Secret Clearance Codes for shared rooms
export const ICAT_2026_SECRETS: HuntSecrets = {
  huntId: ICAT_2026_HUNT_ID,
  codes: {
    // Universal Start & Vault Codes
    "202": { code: "ALPHA202" },
    "401A": { code: "OVERRIDE401A", minigameScoreThreshold: 850 },
    "Audi": { code: "AUDITORIUM" },

    // Route P1 Specific Codes
    "P1_202": { code: "ALPHA202" },
    "P1_Vice principal cabin": { code: "VICEPRIN" },
    "P1_401B": { code: "VR401B" },
    "P1_Staff room": { code: "STAFF_P1" },
    "P1_306": { code: "UIUX_P1" },
    "P1_Staff Lunch": { code: "PANTRY_P1" },
    "P1_Game Lounge": { code: "LOUNGE_P1" },
    "P1_Textile Lab": { code: "TEXTILE" },
    "P1_401A": { code: "OVERRIDE401A", minigameScoreThreshold: 850 },
    "P1_F.L.": { code: "FASHIONLAB" },
    "P1_201": { code: "STUDIO201" },
    "P1_Audi": { code: "AUDITORIUM" },

    // Route P2 Specific Codes
    "P2_202": { code: "ALPHA202" },
    "P2_Game Lounge": { code: "LOUNGE_P2" },
    "P2_503": { code: "SYNAPSE_P2" },
    "P2_Staff Lunch": { code: "PANTRY_P2" },
    "P2_305": { code: "MATRIX_P2" },
    "P2_Staff room": { code: "STAFF_P2" },
    "P2_402": { code: "AUDIO402" },
    "P2_Reception": { code: "RECEPTION_P2" },
    "P2_401A": { code: "OVERRIDE401A", minigameScoreThreshold: 850 },
    "P2_Canteen": { code: "CAFE" },
    "P2_Library": { code: "LIBRARY_P2" },
    "P2_Audi": { code: "AUDITORIUM" },

    // Route P3 Specific Codes
    "P3_202": { code: "ALPHA202" },
    "P3_Photo Lab": { code: "PHOTOLAB" },
    "P3_Staff room": { code: "STAFF_P3" },
    "P3_306": { code: "UIUX_P3" },
    "P3_Library": { code: "LIBRARY_P3" },
    "P3_503": { code: "SYNAPSE_P3" },
    "P3_305": { code: "MATRIX_P3" },
    "P3_Staff Lunch": { code: "PANTRY_P3" },
    "P3_401A": { code: "OVERRIDE401A", minigameScoreThreshold: 850 },
    "P3_206": { code: "CG206" },
    "P3_Reception": { code: "RECEPTION_P3" },
    "P3_Audi": { code: "AUDITORIUM" },

    // Fallback global room codes
    "Vice principal cabin": { code: "VICEPRIN" },
    "401B": { code: "VR401B" },
    "Staff room": { code: "STAFFROOM" },
    "306": { code: "UIUX306" },
    "Staff Lunch": { code: "PANTRY" },
    "Game Lounge": { code: "LOUNGE" },
    "Textile Lab": { code: "TEXTILE" },
    "F.L.": { code: "FASHIONLAB" },
    "201": { code: "STUDIO201" },
    "503": { code: "SYNAPSE503" },
    "305": { code: "MATRIX305" },
    "402": { code: "AUDIO402" },
    "Library": { code: "LIBRARY" },
    "Canteen": { code: "CAFE" },
    "Reception": { code: "RECEPTION" },
    "Photo Lab": { code: "PHOTOLAB" },
    "206": { code: "CG206" },
  },
  treasureSecret: "AUDITORIUM",
  updatedAt: Date.now(),
};
