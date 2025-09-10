/* ------------------ Global State ------------------ */
let activeProfile = "Default";
let config = {
    tolerance: 2,
    cooldown: 5000,
    debug: false,
    moduleEnabled: true,
    alwaysOn: false,
    bossActive: false,
    maxorMessages: true,
};
let debug = config.debug;
let tolerance = config.tolerance;
let cooldown = config.cooldown;
let moduleEnabled = config.moduleEnabled;
let alwaysOn = config.alwaysOn;
let bossActive = config.bossActive;
let maxorMessages = config.maxorMessages

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
            maxorMessages = config.maxorMessages
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
        ChatLib.chat("&e[DungeonMsg] Boss State set to: " + (bossActive ? "§aON" : "§cOFF"));
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
register("chat", (event) => {
    let raw = ChatLib.removeFormatting(ChatLib.getChatMessage(event));

    if (raw.includes("[BOSS] Maxor:")) {
        bossActive = true;
        if (debug) ChatLib.chat("&c[DEBUG:detect] Maxor message detected: " + raw);

        if (maxorMessages == false) {cancel(event);} // hide Maxor's dialog from chat
    }
}).setCriteria("${*}"); // catch all, we filter inside

register("chat", (event) => {
    let raw = ChatLib.removeFormatting(ChatLib.getChatMessage(event));

    if (raw.includes("picked up Energy Crystal!")) {
        bossActive = true;
        if (debug) ChatLib.chat("&c[DEBUG:detect] Crystal message detected: " + raw);
        // do NOT cancel here, crystal message still shows
    }
}).setCriteria("${*}");

/*
// Not currently working, keeping for future bossbar detection
// register("renderBossHealth", () => {
//     let bossName = Renderer.getBossHealth();
//     if (bossName && bossName.includes("Maxor")) {
//         bossActive = true;
//         if (debug) ChatLib.chat("&d[DEBUG] Boss detected from bossbar: " + bossName);
//     }
// });
*/

register("worldLoad", () => {
    bossActive = false;
    if (debug) ChatLib.chat("&d[DEBUG] Server swap detected, boss reset");
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

/* ------------------ GUI ------------------ */
let gui = new Gui();

//  button geometry (size and x are same for every button)
const buttonX = 10,
    buttonW = 110,
    buttonH = 22,
    toggle_Y = 25,
    profile_Y = 50,
    tolerance_Y = 100,
    timer_Y = 125,
    debug_Y = 175,
    alwaysOn_Y = 150,
    maxorMessages_Y = 75
    ;

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

     // Maxor button
    const maxorMessagesHovering = mouseX >= buttonX && mouseX <= buttonX + buttonW &&
        mouseY >= maxorMessages_Y && mouseY <= maxorMessages_Y + buttonH;

    Renderer.drawRect(Renderer.color(50, 50, 50, 180), buttonX, maxorMessages_Y, buttonW, buttonH);
    if (maxorMessagesHovering) Renderer.drawRect(Renderer.color(255, 255, 255, 30), buttonX, maxorMessages_Y, buttonW, buttonH);
    Renderer.drawStringWithShadow("Maxor Messages: " + (maxorMessages ? "§aON" : "§cOFF"), buttonX + 6, maxorMessages_Y + 6);
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
      // Always On Button
    else if (mouseX >= buttonX && mouseX <= buttonX + buttonW &&
        mouseY >= maxorMessages_Y && mouseY <= maxorMessages_Y + buttonH) {
        maxorMessages = !maxorMessages;
        config.maxorMessages = maxorMessages; // Save to config
        saveAll();
        ChatLib.chat("&e[DungeonMsg] Maxor Messages: " + (maxorMessages ? "§aON" : "§cOFF"));
    }
})
