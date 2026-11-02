using System;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using UndertaleModLib.Models;
using UndertaleModLib.Compiler;
var root = Environment.GetEnvironmentVariable("BOSSROOM_COOP_ROOT") ?? Directory.GetCurrentDirectory();
string Read(string name) => File.ReadAllText(Path.Combine(root, "mods", "coop", name + ".gml"));
var group = new CodeImportGroup(Data) { MainThreadAction = MainThreadAction, ThrowOnNoOpFindReplace = true };
string Text(string name) => GetDecompiledText(name).Replace("\r\n", "\n");
void Replace(string name, string code) { if (Data.Code.ByName(name) == null) throw new Exception("Missing native seam: " + name); group.QueueReplace(name, code); }
string One(string code, string oldText, string newText) { if (!code.Contains(oldText)) throw new Exception("Native seam changed: " + oldText); return code.Replace(oldText, newText); }
group.QueueAppend(Data.GameObjects.ByName("obj_time").EventHandlerFor(EventType.Create, Data), Read("init"));
var time = Data.Code.First(c => c.Name.Content.StartsWith("gml_Object_obj_time_Step_") && Text(c.Name.Content).Contains("global.input_held"));
var timeCode = Text(time.Name.Content);
timeCode += "\n" + Read("poll");
Replace(time.Name.Content, timeCode);
group.QueueAppend(Data.GameObjects.ByName("obj_time").EventHandlerFor(EventType.Step, EventSubtypeStep.EndStep, Data), Read("telemetry"));
Replace("gml_Object_obj_heart_Step_0", Read("heart-before") + "\n" + Text("gml_Object_obj_heart_Step_0") + "\n" + Read("heart-after"));
Replace("gml_Object_obj_heart_Collision_obj_collidebullet", Read("collision"));
group.QueuePrepend("gml_Object_obj_heart_Draw_0", Read("heart-draw"));
foreach (var functionName in new [] { "scr_damage", "scr_damage_proportional", "scr_damage_sneo_final_attack", "scr_damage_fixed", "scr_damage_maxhp" })
{
var damageName = "gml_GlobalScript_" + functionName;
if (Data.Code.ByName(damageName) == null) continue;
var damage = Text(damageName);
var functionStart = damage.IndexOf("function " + functionName + "(");
if (functionStart < 0) throw new Exception("Damage helper changed: " + functionName);
var body = damage.IndexOf('{', functionStart);
damage = damage.Insert(body + 1, @"
if (global.br_active && global.br_hit_owner >= 0) {
    var br_slot = global.br_target(global.br_hit_owner, target);
    if (br_slot < 0) return;
    target = br_slot;
}
");
damage = damage.Replace("with (obj_heart)", "with (global.br_active && global.br_hit_owner >= 0 ? global.br_hit_heart : obj_heart)");
Replace(damageName, damage);
}
var all = Text("gml_GlobalScript_scr_damage_all");
all = One(all, "if (global.inv < 0)", "if (global.br_active && global.br_hit_owner >= 0) { scr_damage(); return; }\n    if (global.inv < 0)");
Replace("gml_GlobalScript_scr_damage_all", all);
// Jevil's scythe bypasses the common damage helpers with percentage HP damage.
if (Data.Code.ByName("gml_Object_obj_laserscythe_Other_15") != null)
{
    var scythe = Text("gml_Object_obj_laserscythe_Other_15");
    var fix = @"if (global.br_active && global.br_hit_owner >= 0) {
 if (active == 1 && global.inv < 0) {
  var slot = global.br_target(global.br_hit_owner, target);
  if (slot >= 0) {
   var ch = global.char[slot];
   if (global.hp[ch] >= 10) { global.hp[ch] = ceil(global.hp[ch] * 0.7); global.inv = global.invc * 40; snd_play(snd_hurt1); }
   else { target = slot; scr_damage(); }
  }
 }
 exit;
}
";
    Replace("gml_Object_obj_laserscythe_Other_15", fix + scythe);
}
// Associate each graze sensor with its own heart rather than the first instance.
var heartCreate = Text("gml_Object_obj_heart_Create_0");
heartCreate = One(heartCreate, "instance_create(x + 10, y + 10, obj_grazebox);", "var br_graze = instance_create(x + 10, y + 10, obj_grazebox); br_graze.br_heart = id;");
Replace("gml_Object_obj_heart_Create_0", heartCreate + "\n" + Read("heart-create"));
var graze = Text("gml_Object_obj_grazebox_Step_2");
Replace("gml_Object_obj_grazebox_Step_2", "if (variable_instance_exists(id, \"br_heart\") && global.br_active) { if (instance_exists(br_heart)) { x = br_heart.x + 10; y = br_heart.y + 10; } else instance_destroy(); exit; }\n" + graze);
var grazeCollision = Text("gml_Object_obj_grazebox_Collision_obj_collidebullet");
Replace("gml_Object_obj_grazebox_Collision_obj_collidebullet", "var br_graze_inv = global.inv; if (global.br_active && variable_instance_exists(id, \"br_heart\") && instance_exists(br_heart)) global.inv = br_heart.br_inv;\n" + grazeCollision + "\nglobal.inv = br_graze_inv;");
// Attack bars belong to characters too, even when charturn is the native value 3.
var attackName = "gml_Object_obj_attackpress_Draw_0";
var attack = Text(attackName);
var scoring = Regex.Match(attack, @"if \(global\.flag\[13\] == 1\)\s*\{\s*if \(button1_p\(\) && havechar\[0\] == 1\)[\s\S]*?scr_boltcheck_onebutton\(0\);\s*\}");
if (!scoring.Success) throw new Exception("Attack timing seam changed");
var partyScoring = @"if (global.br_active) {
 for (var slot = 0; slot < 3; slot++) {
  var ch = global.char[slot];
  if (ch > 0 && ch <= 3 && havechar[slot] == 1 && global.br_pressed[global.br_owners[ch - 1]][4]) scr_boltcheck(slot);
 }
} else { " + scoring.Value + " }";
Replace(attackName, attack.Replace(scoring.Value, partyScoring));
if (Data.Code.ByName("gml_Object_obj_rudebuster_bolt_Step_0") != null)
{
 var bolt = Text("gml_Object_obj_rudebuster_bolt_Step_0");
 Replace("gml_Object_obj_rudebuster_bolt_Step_0", One(bolt, "button1_p()", "(global.br_active ? global.br_pressed[global.br_owners[global.char[caster] - 1]][4] : button1_p())"));
}
var previous = Text("gml_GlobalScript_scr_prevhero");
previous = One(previous, "function scr_prevhero()\n{", @"function scr_prevhero() {
 if (global.br_active) {
  var current = global.charturn;
  var prev = current;
  if (current == 1 && global.charmove[0] == 1) prev = 0;
  if (current == 2) {
   if (global.charmove[1] == 1 && global.acting[1] == 0) prev = 1;
   else if (global.charmove[0] == 1) prev = 0;
  }
  if (prev != current && global.br_owners[global.char[prev] - 1] != global.br_owners[global.char[current] - 1]) return;
 }
");
Replace("gml_GlobalScript_scr_prevhero", previous);
// QA hooks are built only into local test artifacts, never the shipped patch.
if (Environment.GetEnvironmentVariable("BOSSROOM_COOP_QA") == "1")
{
    group.QueueAppend(Data.GameObjects.ByName("obj_time").EventHandlerFor(EventType.Step, EventSubtypeStep.EndStep, Data), Read("qa"));
    group.QueuePrepend("gml_Object_obj_battlecontroller_Step_0", "if (variable_global_exists(\"br_qa_mode\") && global.br_qa_mode) exit;");
}
group.Import();
Console.WriteLine("Party co-op native hooks compiled. QA=" + Environment.GetEnvironmentVariable("BOSSROOM_COOP_QA"));
