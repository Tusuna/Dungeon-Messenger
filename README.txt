DUNGEON MSG DOC:

Functionality:
Detects when player is at specific coordinates and sends a chat message

Requirements:
Maxor chat messages must be visable to you BEFORE installing the module, its currently the only method to detecting when in the F7 boss fight with the module
Theres an option to hide the messages in the module if you wish to do so, but the module itself must do it for detection purposes

Settings:
Toggle (On,Off)- Toggles entire module  on and off
Profiles (Default, custom 1-5)- Saves all settings and waypoints
Maxor Messages (On, Off)- Toggles whether maxor messages are shown to the player (doesnt interfere with boss detection)
Tolerance (1-10)- how far from waypoint you have to be to trigger it
Timer (1-10)- how long before a waypoint can be retriggered (note: walking away and back doesn't reset timer, can be added, unsure if it would be useful)
AlwaysOn (On,Off)- Toggles if always check for cords (on) or use the built in boss detection to only check when in boss (off)
Debug (On,Off)- Toggles debug messages on and off

Profiles:
You can edit profiles directly in the profiles.json file (Follow format as seen in default, set lastTiggered = 1 and triggered = true)
All changes made ingame (via commands) directly edit the profile in the .json file aswell

Current commands:
/dmsg - opens ui
/dmsg add 'x' 'y' 'z' 'name' - adds waypoint to current profile (if cords ommited uses player pos)
/dmsg print - prints all waypoint in profile and their indecies
/dmsg remove 'indecie' - removes specified waypoint
/dmsg active - swaps boss state to true or false (will be overwritten by world loads, use alwayson setting to prevent)

TODO:
- Boss detection*, only detects maxor chat messages, planned to detect bossbar or other checks to ensure accuracy
- Setup default profile waypoints, semi done - need more waypoints*

