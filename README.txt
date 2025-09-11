DUNGEON MSG DOC:

Functionality:
Detects when player is at specific coordinates and sends a chat message

Settings:
Toggle (On,Off)- Toggles entire module  on and off
Profiles (Default, custom 1-5)- Saves Tolerance, timer, and waypoints
Tolerance (1-10)- how far from waypoint you have to be to trigger it
Timer (1-10)- how long before a waypoint can be retriggered (note: walking away and back doesn't reset timer, can be added, unsure if it would be useful)
i4: (On, Off) - Only use if you are i4 bers, automatically says "Complete" "Failed" and "incomplete" messages for you
Debug (On,Off)- Toggles debug messages on and off
AlwaysOn (On,Off)- Toggles if always check for cords (on) or use the built in boss detection (off)

Profiles:
You can edit profiles directly in the profiles.json file (Follow format as seen in default)
All changes made ingame (via commands) directly edit the profile in the json file aswell

Current commands:
/dmsg - opens ui
/dmsg add 'x' 'y' 'z' 'name' - adds waypoint to current profile (if cords ommited uses player pos)
/dmsg print - prints all waypoint in profile and their indecies
/dmsg remove 'indecie' - removes specified waypoint
/dmsg active - sets the boss to active (will be overwritten by world loads, use alwayson setting to prevent)
/tps - Measues server tps over 3 seconds

TODO:
- Boss detection*, only detects maxor chat messages, planned to detect bossbar or other checks to ensure accuracy
- Setup default profile waypoints, semi done - need more waypoints*

