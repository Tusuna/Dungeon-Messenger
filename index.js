/// <reference lib="es2015" />

/* ------------------ Global State ------------------ */
let enabled = true;
let activeProfile = "Default";
let config = {
    tolerance: 2,
    cooldown: 5000
};
let tolerance = config.tolerance;
let cooldown = config.cooldown;



/* ------------------ Profile Loading ------------------ */
const savePath = "DungeonMsg"; // folder in ./config/ChatTriggers/modules/

function saveAll() {
    try {
        FileLib.write(savePath, "profiles.json", JSON.stringify({
            profiles: profiles,
            config: config
        }, null, 2));
        ChatLib.chat("&d[DEBUG:saveAll] Saved profiles + config");
    } catch (e) {
        ChatLib.chat("&c[DEBUG:saveAll] Failed to save: " + e);
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
            tolerance = config.tolerance;
            cooldown = config.cooldown;

            ChatLib.chat("&d[DEBUG:loadAll] Loaded profiles + config");
        } else {
            ChatLib.chat("&e[DEBUG:loadAll] No saved file, starting fresh");
        }
    } catch (e) {
        ChatLib.chat("&c[DEBUG:loadAll] Failed to load: " + e);
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
        enabled = true;
        ChatLib.chat("&a[DungeonMsg] Manually set boss as active!");
    }   else if (args[0] === "add") {
        addWaypoint(...args);
    }
        else if (args[0] === "print") {
        printWaypoints();
    } 
        else if (args[0] === "remove") {
        removeWaypoint(...args)
        }
        else if (args[0] === "debugsave") {
        ChatLib.chat("&d[DEBUG] Profiles in memory: " + JSON.stringify(profiles));
        saveAll();

}
        else {
        openDungeonMsgGUI();
    }
}).setName("dmsg");

function openDungeonMsgGUI() {
    ChatLib.chat("&d[DEBUG:openDungeonMsgGUI] Opening GUI");
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


function addWaypoint(blank,x,y,z, ...name) {
     ChatLib.chat("&d[DEBUG:/dmadd] Command triggered with args: " + [x, y, z, name.join(" ")]);

    if (!x || !y || !z || name.length === 0) {
        ChatLib.chat("&c[DEBUG:/dmadd] Invalid usage");
        return;
    }
    const wp = {
    x: parseInt(x),
    y: parseInt(y),
    z: parseInt(z),
    name: name.join(" "),
    lastTriggered: 0 // new field
};

    profiles[activeProfile].push(wp);
    saveAll();


    ChatLib.chat("&a[DEBUG:/dmadd] Waypoint added to " + activeProfile + ": " + wp.name);

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

    // Adjust index (player sees 1-based list, array is 0-based)
    let removed = wpList.splice(index - 1, 1);
    saveAll();



    ChatLib.chat("&a[DungeonMsg] Removed waypoint #" + index + ": " + removed.name +
                 " (" + removed.x + ", " + removed.y + ", " + removed.z + ")");
}


/* ------------------ Detect Boss Start ------------------ */
// TODO: figure out when tigger i can use for boss start 
// currently boss is set to always active

/* ------------------ Waypoint Detection ------------------ */
register("tick", function() {
    if (enabled === true) {
        let pos = { x: Math.floor(Player.getX()), y: Math.floor(Player.getY()), z: Math.floor(Player.getZ()) };

        let wpList = profiles[activeProfile];
        if (!wpList) {
            ChatLib.chat("&c[DEBUG:tick] No waypoints in profile " + activeProfile);
            return;
        }

        for (let i = 0; i < wpList.length; i++) {
            let wp = wpList[i];
            if (withinTolerance(pos, wp, tolerance)) {
                ChatLib.chat("&b[DEBUG:tick] Entered waypoint " + wp.name);
                ChatLib.say("at " + wp.name);
                wp.triggered = true;
            }
        }
    } else {
        return;
    }
});

/* ------------------ Helpers ------------------ */
function withinTolerance(p, wp, tol) {
    let now = Date.now();
    let cooldown = 5000; // 5 seconds

    let inRange =
        Math.abs(p.x - wp.x) <= tol &&
        Math.abs(p.y - wp.y) <= tol &&
        Math.abs(p.z - wp.z) <= tol;

    let offCooldown = (now - wp.lastTriggered) >= cooldown;

    if (inRange && offCooldown) {
        wp.lastTriggered = now; // reset cooldown
        return true;
    }
    return false;
}


/* ------------------ GUI ------------------ */
// touching the gui code at all seems to break everything
// but TODO: Add interaction and functionality to it
// basically just a debug gui at the moment
/* ------------------ GUI ------------------ */
let gui = new Gui();

// Simple toggle button geometry
const buttonX = 10, buttonW = 110, buttonH = 22, toggle_Y = 25 ,profile_Y = 50, tolerance_Y = 75, timer_Y = 100;

function openDungeonMsgGUI() {
  ChatLib.chat("&d[DEBUG:openDungeonMsgGUI] Opening GUI");
  gui.open();
}

gui.registerDraw(function(mouseX, mouseY, partialTicks) {
  Renderer.drawStringWithShadow("§bDungeonMsg Config", 10, 10);

  // Toggle Button (hover highlight)
  const toggleHovering = mouseX >= buttonX && mouseX <= buttonX + buttonW &&
                   mouseY >= toggle_Y && mouseY <= toggle_Y + buttonH;

  Renderer.drawRect(Renderer.color(50, 50, 50, 180), buttonX, toggle_Y, buttonW, buttonH);
  if (toggleHovering) Renderer.drawRect(Renderer.color(255, 255, 255, 30), buttonX, toggle_Y, buttonW, buttonH);
  Renderer.drawStringWithShadow("Toggle: " + (enabled ? "§aON" : "§cOFF"), buttonX + 6, toggle_Y + 6);

    // Profile Button (hover highlight)
  const profileHovering = mouseX >= buttonX && mouseX <= buttonX + buttonW &&
                   mouseY >= profile_Y && mouseY <= profile_Y + buttonH;

  Renderer.drawRect(Renderer.color(50, 50, 50, 180), buttonX, profile_Y, buttonW, buttonH);
  if (profileHovering) Renderer.drawRect(Renderer.color(255, 255, 255, 30), buttonX, profile_Y, buttonW, buttonH);
  Renderer.drawStringWithShadow("Profile: " + activeProfile, buttonX + 6, profile_Y + 6);

// Tolerance Button (hover highlight)
  const toleranceHovering = mouseX >= buttonX && mouseX <= buttonX + buttonW &&
                   mouseY >= tolerance_Y && mouseY <= tolerance_Y + buttonH;

  Renderer.drawRect(Renderer.color(50, 50, 50, 180), buttonX, tolerance_Y, buttonW, buttonH);
  if (toleranceHovering) Renderer.drawRect(Renderer.color(255, 255, 255, 30), buttonX, tolerance_Y, buttonW, buttonH);
  Renderer.drawStringWithShadow("Tolerance: " + tolerance + " blocks", buttonX + 6, tolerance_Y + 6);

// Timer Button (hover highlight)
const timerHovering = mouseX >= buttonX && mouseX <= buttonX + buttonW &&
                      mouseY >= timer_Y && mouseY <= timer_Y + buttonH;

Renderer.drawRect(Renderer.color(50, 50, 50, 180), buttonX, timer_Y, buttonW, buttonH);
if (timerHovering) Renderer.drawRect(Renderer.color(255, 255, 255, 30), buttonX, timer_Y, buttonW, buttonH);
Renderer.drawStringWithShadow("Timer: " + (cooldown / 1000) + " seconds", buttonX + 6, timer_Y + 6);
});

gui.registerClicked(function(mouseX, mouseY, button) {
  // Toggle button
  if (mouseX >= buttonX && mouseX <= buttonX + buttonW &&
      mouseY >= toggle_Y && mouseY <= toggle_Y + buttonH) {
    enabled = !enabled;
    ChatLib.chat("&e[DungeonMsg] Enabled set to: " + (enabled ? "§aON" : "§cOFF"));
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
}})
