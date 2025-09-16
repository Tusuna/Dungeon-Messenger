/* ------------------ Global State ------------------ */
let activeProfile = "Default";
let config = {
    tolerance: 2,
    cooldown: 5000,
    debug: false,
    moduleEnabled: true,
    alwaysOn: false,
    bossActive: false,
    i4: false
};
let debug = config.debug;
let tolerance = config.tolerance;
let cooldown = config.cooldown;
let moduleEnabled = config.moduleEnabled;
let alwaysOn = config.alwaysOn;
let bossActive = config.bossActive;
let i4 = config.i4
let completedTerms = 0

/* ------------------ Profile Loading ------------------ */
const savePath = "DungeonMsg"; // folder in ./config/ChatTriggers/modules/

function saveAll() {
    try {
        FileLib.write(savePath, "profiles.json", JSON.stringify({
            profiles: profiles,
            config: config
        }, null, 2));
        if (debug === true) {
            ChatLib.chat("&d[DEBUG:saveAll] Saved profiles + config");
        }
    } catch (e) {
        if (debug === true) {
            ChatLib.chat("&c[DEBUG:saveAll] Failed to save: " + e);
        }
    }
}

function loadAll() {
    try {
        let data = FileLib.read(savePath, "profiles.json");
        if (data && data.trim().length > 0) {
            let parsed = JSON.parse(data);
            profiles = parsed.profiles || profiles;
            config = parsed.config || config;

            // sync globals
            config = parsed.config || config;
            tolerance = config.tolerance;
            cooldown = config.cooldown;
            debug = config.debug;
            moduleEnabled = config.moduleEnabled;
            alwaysOn = config.alwaysOn;
            bossActive = config.bossActive;
            i4 = config.i4
            if (debug === true) {
                ChatLib.chat("&d[DEBUG:loadAll] Loaded profiles + config");
            }
        } else {
            if (debug === true) {
                ChatLib.chat("&e[DEBUG:loadAll] No saved file, starting fresh");
            }
        }
    } catch (e) {
        if (debug === true) {
            ChatLib.chat("&c[DEBUG:loadAll] Failed to load: " + e);
        }
    }
}

let profiles = {
    "Default": [],
    "Custom 1": [],
    "Custom 2": [],
    "Custom 3": [],
    "Custom 4": [],
    "Custom 5": []
};

loadAll();

ChatLib.chat("&d[DEBUG:init] Module loaded and globals set");

/* ------------------ Commands ------------------ */
register("command", function(...args) {
    if (args[0] === "active") {
        bossActive = !bossActive;
        ChatLib.chat("&e[DungeonMsg] Always On set to: " + (bossActive ? "§aON" : "§cOFF"));
    } else if (args[0] === "add") {
        addWaypoint(...args);
    } else if (args[0] === "print") {
        printWaypoints();
    } else if (args[0] === "remove") {
        removeWaypoint(...args)
    } else if (args[0] === "debugsave") {
        if (debug === true) {
            ChatLib.chat("&d[DEBUG] Profiles in memory: " + JSON.stringify(profiles));
        }
        saveAll();
    } else {
        openDungeonMsgGUI();
    }
}).setName("dmsg");

//TPS Command
let tickCount = 0;
let tpsStart = 0;

register("command", function() {
    tickCount = 0;
    tpsStart = Date.now();

    // Measure for 3 seconds
    setTimeout(() => {
        let duration = (Date.now() - tpsStart) / 1000; // seconds
        let tps = (tickCount / duration).toFixed(2);
        ChatLib.chat("&e[DungeonMsg] Server TPS: §a" + tps);
    }, 3000);

    ChatLib.chat("&e[DungeonMsg] Measuring TPS...");
}).setName("tps");

register("tick", () => {
    if (tpsStart > 0) tickCount++;
});

// /dmsg command functions
function openDungeonMsgGUI() {
    if (debug === true) {
        ChatLib.chat("&d[DEBUG:openDungeonMsgGUI] Opening GUI");
    }
    gui.open();
}

function printWaypoints() {
    let wpList = profiles[activeProfile];
    if (!wpList || wpList.length === 0) {
        ChatLib.chat("&e[DungeonMsg] No waypoints in profile " + activeProfile);
        return;
    }
    ChatLib.chat("&b[DungeonMsg] Waypoints in " + activeProfile + ":");
    wpList.forEach((wp, i) => {
        ChatLib.chat("&7" + (i + 1) + ". " + wp.name +
            " (" + wp.x + ", " + wp.y + ", " + wp.z + ")");
    });
}


function addWaypoint(blank, ...args) {
    let x, y, z, name;

    if (args.length >= 4) {
        // User provided coordinates
        x = parseInt(args[0]);
        y = parseInt(args[1]);
        z = parseInt(args[2]);
        name = args.slice(3).join(" ");
    } else if (args.length >= 1) {
        // User only provided a name, use current position
        x = Math.floor(Player.getX());
        y = Math.floor(Player.getY());
        z = Math.floor(Player.getZ());
        name = args.join(" ");
    } else {
        // Invalid usage
        ChatLib.chat("&cUsage: /dmsg add [x] [y] [z] <name> or /dmsg add <name>");
        return;
    }

    const wp = {
        x: x,
        y: y,
        z: z,
        name: name,
        lastTriggered: 0
    };

    profiles[activeProfile].push(wp);
    saveAll();
    ChatLib.chat("&a[DungeonMsg] Waypoint added to " + activeProfile + ": " + wp.name);
}

function removeWaypoint(blank, indexStr) {
    if (!indexStr) {
        ChatLib.chat("&cUsage: /dmsg remove <index>");
        return;
    }

    let index = parseInt(indexStr);
    let wpList = profiles[activeProfile];

    if (!wpList || wpList.length === 0) {
        ChatLib.chat("&c[DungeonMsg] No waypoints in profile " + activeProfile);
        return;
    }

    if (isNaN(index) || index < 1 || index > wpList.length) {
        ChatLib.chat("&c[DungeonMsg] Invalid index. Use /dmsg print to see waypoint numbers.");
        return;
    }

    let removed = wpList.splice(index - 1, 1)[0];
    saveAll();

    ChatLib.chat("&a[DungeonMsg] Removed waypoint #" + index + ": " + removed.name +
        " (" + removed.x + ", " + removed.y + ", " + removed.z + ")");
}



/* ------------------ Boss detection ------------------ */
register("chat", (player, event) => {
    bossActive = true
  if (debug) ChatLib.chat("&c[DEBUG:dectect] Maxor message detected");
}).setCriteria("[BOSS] Maxor:").setContains();

register("chat", (player, event) => {
    bossActive = true
  if (debug) ChatLib.chat("&c[DEBUG:detect] Crystal message detected");
}).setCriteria("picked up Energy Crystal!").setContains();

//register("renderBossHealth", () => {
//    let bossName = Renderer.getBossHealth();
//    if (bossName && bossName.includes("Maxor")) {
//        bossActive = true;
//        if (debug) ChatLib.chat("&d[DEBUG] Boss detected from bossbar: " + bossName);
//    }
//});


register("worldLoad", () => {
    bossActive = false;
    completedTerms = 0
    if (debug) ChatLib.chat("&d[DEBUG] Server swap detected");
});


/* ------------------ Waypoint Detection ------------------ */
register("tick", function() {
    if (!(moduleEnabled && (alwaysOn || bossActive))) return;

    let pos = {
        x: Math.floor(Player.getX()),
        y: Math.floor(Player.getY()),
        z: Math.floor(Player.getZ())
    };

    let wpList = profiles[activeProfile];
    if (!wpList) {
        if (debug) ChatLib.chat("&c[DEBUG:tick] No waypoints in profile " + activeProfile);
        return;
    }

    for (let i = 0; i < wpList.length; i++) {
        let wp = wpList[i];
        if (withinTolerance(pos, wp, tolerance)) {
            if (debug) ChatLib.chat("&b[DEBUG:tick] Entered waypoint " + wp.name);
            ChatLib.say("at " + wp.name);
        }
    }
});

/* ------------------ Helpers ------------------ */
function withinTolerance(p, wp, tol) {
    let now = Date.now();
    // Cooldown is now a global variable, no need to redefine it
    let offCooldown = (now - wp.lastTriggered) >= cooldown;

    let inRange =
        Math.abs(p.x - wp.x) <= tol &&
        Math.abs(p.y - wp.y) <= tol &&
        Math.abs(p.z - wp.z) <= tol;

    if (inRange && offCooldown) {
        wp.lastTriggered = now; // reset cooldown
        return true;
    }
    return false;
}

/* ------------------ I4 Detector ------------------ */
let iFourActive = false;
let iFourStart = false;
let iFourComplete = false;

// placeholder coords, update to the real I4 pressure plate coords
let iFourPlate = { x: -16, y: 5, z: 14 };
let iFourTol = 2; // how close to plate counts as "on it"

register("chat", (player, event) => {
     completedTerms += 1
  if (debug) ChatLib.chat("&c[DEBUG:i4] Terminal message deteceted: #" + completedTerms);
}).setCriteria("completed a terminal!").setContains();

register("tick", () => {
    
    if (!(bossActive && moduleEnabled) || (iFourComplete)) return;
    let px = Math.floor(Player.getX());
    let py = Math.floor(Player.getY());
    let pz = Math.floor(Player.getZ());

    let onPlate =
        Math.abs(px - iFourPlate.x) <= iFourTol &&
        Math.abs(py - iFourPlate.y) <= iFourTol &&
        Math.abs(pz - iFourPlate.z) <= iFourTol;

    if (onPlate && !iFourActive) {
        iFourActive = true;
        iFourStart = true;
        iFourComplete = false;
        ChatLib.say("i4 started");
        if (debug) ChatLib.chat("&d[DEBUG:I4] Entered plate coords: " + JSON.stringify(iFourPlate));
    }

    if (!onPlate && iFourActive && !iFourComplete) {
        // left plate without completing
        iFourActive = false;
        ChatLib.say("i4 failed")
        if (debug) ChatLib.chat("&d[DEBUG:I4] Player left plate before completion or died");
    }

    if (completedTerms >= 9) {
        // left plate without completing
        iFourActive = false;
        iFourComplete = true;
        ChatLib.say("i4 Incomplete");
        if (debug) ChatLib.chat("&d[DEBUG:I4] Too many terminals completed");
    }

    if (debug && iFourActive) {
        Renderer.drawStringWithShadow("§d[I4 DEBUG] Active | Pos: " + px + "," + py + "," + pz, 10, 200);
    }
});

register("chat", (event) => {
    let raw = ChatLib.removeFormatting(ChatLib.getChatMessage(event));
    let playerName = Player.getName();

    if (iFourActive && raw.includes(playerName + " completed a device")) {
        iFourComplete = true;
        iFourActive = false;
        ChatLib.say("i4 Complete");
        if (debug) ChatLib.chat("&d[DEBUG:I4] Detected completion message: " + raw);
    }
}).setCriteria("${*}");

/* ------------------ Debug Commands ------------------ */
register("command", () => {
    ChatLib.chat("&b[I4 Debug] Current Plate: " + JSON.stringify(iFourPlate));
    ChatLib.chat("&b[I4 Debug] Active: " + iFourActive + " | Started: " + iFourStart + " | Complete: " + iFourComplete);
    ChatLib.chat("&b[I4 Debug] BossActive: " + bossActive);
}).setName("i4debug");

register("command", (x, y, z) => {
    if (!x || !y || !z) {
        ChatLib.chat("&cUsage: /i4set <x> <y> <z>");
        return;
    }
    iFourPlate = { x: parseInt(x), y: parseInt(y), z: parseInt(z) };
    ChatLib.chat("&e[I4 Debug] Plate set to: " + JSON.stringify(iFourPlate));
}).setName("i4set");


/* ------------------ GUI ------------------ */
let gui = new Gui();

//  button geometry (size and x are same for every button)
const buttonX = 10,
    buttonW = 110,
    buttonH = 22,
    toggle_Y = 25,
    profile_Y = 50,
    tolerance_Y = 75,
    timer_Y = 100,
    i4_Y = 125
    debug_Y = 150,
    alwaysOn_Y = 175;

function openDungeonMsgGUI() {
    if (debug === true) {
        ChatLib.chat("&d[DEBUG:openDungeonMsgGUI] Opening GUI");
    }
    gui.open();
}

gui.registerDraw(function(mouseX, mouseY, partialTicks) {
    Renderer.drawStringWithShadow("§bDungeonMsg Config", 10, 10);

    // Toggle Button 
    const toggleHovering = mouseX >= buttonX && mouseX <= buttonX + buttonW &&
        mouseY >= toggle_Y && mouseY <= toggle_Y + buttonH;

    Renderer.drawRect(Renderer.color(50, 50, 50, 180), buttonX, toggle_Y, buttonW, buttonH);
    if (toggleHovering) Renderer.drawRect(Renderer.color(255, 255, 255, 30), buttonX, toggle_Y, buttonW, buttonH);
    Renderer.drawStringWithShadow("Toggle: " + (moduleEnabled ? "§aON" : "§cOFF"), buttonX + 6, toggle_Y + 6);

    // Profile Button
    const profileHovering = mouseX >= buttonX && mouseX <= buttonX + buttonW &&
        mouseY >= profile_Y && mouseY <= profile_Y + buttonH;

    Renderer.drawRect(Renderer.color(50, 50, 50, 180), buttonX, profile_Y, buttonW, buttonH);
    if (profileHovering) Renderer.drawRect(Renderer.color(255, 255, 255, 30), buttonX, profile_Y, buttonW, buttonH);
    Renderer.drawStringWithShadow("Profile: " + activeProfile, buttonX + 6, profile_Y + 6);

    // Tolerance Button
    const toleranceHovering = mouseX >= buttonX && mouseX <= buttonX + buttonW &&
        mouseY >= tolerance_Y && mouseY <= tolerance_Y + buttonH;

    Renderer.drawRect(Renderer.color(50, 50, 50, 180), buttonX, tolerance_Y, buttonW, buttonH);
    if (toleranceHovering) Renderer.drawRect(Renderer.color(255, 255, 255, 30), buttonX, tolerance_Y, buttonW, buttonH);
    Renderer.drawStringWithShadow("Tolerance: " + tolerance + " blocks", buttonX + 6, tolerance_Y + 6);

    // Timer Button
    const timerHovering = mouseX >= buttonX && mouseX <= buttonX + buttonW &&
        mouseY >= timer_Y && mouseY <= timer_Y + buttonH;

    Renderer.drawRect(Renderer.color(50, 50, 50, 180), buttonX, timer_Y, buttonW, buttonH);
    if (timerHovering) Renderer.drawRect(Renderer.color(255, 255, 255, 30), buttonX, timer_Y, buttonW, buttonH);
    Renderer.drawStringWithShadow("Timer: " + (cooldown / 1000) + " seconds", buttonX + 6, timer_Y + 6);

    // Debug Button 
    const debugHovering = mouseX >= buttonX && mouseX <= buttonX + buttonW &&
        mouseY >= debug_Y && mouseY <= debug_Y + buttonH;

    Renderer.drawRect(Renderer.color(50, 50, 50, 180), buttonX, debug_Y, buttonW, buttonH);
    if (debugHovering) Renderer.drawRect(Renderer.color(255, 255, 255, 30), buttonX, debug_Y, buttonW, buttonH);
    Renderer.drawStringWithShadow("Debug Mode: " + (debug ? "§aON" : "§cOFF"), buttonX + 6, debug_Y + 6);

    // Always On button
    const alwaysOnHovering = mouseX >= buttonX && mouseX <= buttonX + buttonW &&
        mouseY >= alwaysOn_Y && mouseY <= alwaysOn_Y + buttonH;

    Renderer.drawRect(Renderer.color(50, 50, 50, 180), buttonX, alwaysOn_Y, buttonW, buttonH);
    if (alwaysOnHovering) Renderer.drawRect(Renderer.color(255, 255, 255, 30), buttonX, alwaysOn_Y, buttonW, buttonH);
    Renderer.drawStringWithShadow("Always On: " + (alwaysOn ? "§aON" : "§cOFF"), buttonX + 6, alwaysOn_Y + 6);
   
    // i4 button
    const i4Hovering = mouseX >= buttonX && mouseX <= buttonX + buttonW &&
        mouseY >= i4_Y && mouseY <= i4_Y + buttonH;

    Renderer.drawRect(Renderer.color(50, 50, 50, 180), buttonX, i4_Y, buttonW, buttonH);
    if (i4Hovering) Renderer.drawRect(Renderer.color(255, 255, 255, 30), buttonX, i4_Y, buttonW, buttonH);
    Renderer.drawStringWithShadow("i4: " + (i4 ? "§aON" : "§cOFF"), buttonX + 6, i4_Y + 6);
});

// gui interaction functionality
gui.registerClicked(function(mouseX, mouseY, button) {
    // Toggle button
    if (mouseX >= buttonX && mouseX <= buttonX + buttonW &&
        mouseY >= toggle_Y && mouseY <= toggle_Y + buttonH) {
        moduleEnabled = !moduleEnabled;
        config.moduleEnabled = moduleEnabled; // Save to config
        saveAll();
        ChatLib.chat("&e[DungeonMsg] Enabled set to: " + (moduleEnabled ? "§aON" : "§cOFF"));
    }

    // Profile button: cycle through profiles
    else if (mouseX >= buttonX && mouseX <= buttonX + buttonW &&
        mouseY >= profile_Y && mouseY <= profile_Y + buttonH) {
        let keys = Object.keys(profiles);
        let idx = keys.indexOf(activeProfile);
        activeProfile = keys[(idx + 1) % keys.length]; // cycle forward
        ChatLib.chat("&e[DungeonMsg] Active profile set to: §b" + activeProfile);
    }

    // Tolerance button
    else if (mouseX >= buttonX && mouseX <= buttonX + buttonW &&
        mouseY >= tolerance_Y && mouseY <= tolerance_Y + buttonH) {
        tolerance++;
        if (tolerance > 10) tolerance = 1;
        config.tolerance = tolerance;
        saveAll();
        ChatLib.chat("&e[DungeonMsg] Tolerance set to: §b" + tolerance + " blocks");
    }

    // Timer button
    else if (mouseX >= buttonX && mouseX <= buttonX + buttonW &&
        mouseY >= timer_Y && mouseY <= timer_Y + buttonH) {
        cooldown += 1000;
        if (cooldown > 10000) cooldown = 1000;
        config.cooldown = cooldown;
        saveAll();
        ChatLib.chat("&e[DungeonMsg] Timer set to: §b" + (cooldown / 1000) + " seconds");
    }
    // Debug button
    else if (mouseX >= buttonX && mouseX <= buttonX + buttonW &&
        mouseY >= debug_Y && mouseY <= debug_Y + buttonH) {
        debug = !debug;
        config.debug = debug;
        saveAll();
        ChatLib.chat("&e[DungeonMsg] Debug set to: " + (debug ? "§aON" : "§cOFF"));
    }
    // Always On Button
    else if (mouseX >= buttonX && mouseX <= buttonX + buttonW &&
        mouseY >= alwaysOn_Y && mouseY <= alwaysOn_Y + buttonH) {
        alwaysOn = !alwaysOn;
        config.alwaysOn = alwaysOn; // Save to config
        saveAll();
        ChatLib.chat("&e[DungeonMsg] Always On set to: " + (alwaysOn ? "§aON" : "§cOFF"));
    }
    // i4 button
    if (mouseX >= buttonX && mouseX <= buttonX + buttonW &&
        mouseY >= i4_Y && mouseY <= i4_Y + buttonH) {
        i4 = !i4;
        config.i4 = i4; // Save to config
        saveAll();
        ChatLib.chat("&e[DungeonMsg] i4 set to: " + (i4 ? "§aON" : "§cOFF"));
    }
})

