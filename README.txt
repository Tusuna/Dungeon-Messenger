DUNGEON MSG DOC:

Functionality:
Detects when player is at specific coordinates and sends a chat message

Settings:
Toggle (On,Off)- Toggles waypoints messages on and off
Profiles (Default, custom 1-5)- Saves Tolerance, timer, and waypoints
Tolerance (1-10)- how far from waypoint you have to be to trigger it
Timer (1-10)- how long before a waypoint can be retriggered (note: walking away and back doesn't reset timer, can be added, unsure if it would be useful)

Profiles:
You can edit profiles directly in the profiles.json file (Follow format as seen in default)
All changes made ingame (via commands) directly edit the profile in the json file aswell

Current commands:
/dmsg - opens ui
/dmsg add 'x' 'y' 'z' 'name' - adds waypoint to current profile
/dmsg print - prints all waypoint in profile and their indecies
/dmsg remove 'indecie' - removes specified waypoint

TODO:
- Boss detection
- Setup default profile waypoints
- Add debug mode option (currently on by default, not changeable)
- make /dmsg add use players current pos for cords if arg not specified
- come up with better name