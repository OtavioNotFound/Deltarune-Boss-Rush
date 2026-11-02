using System;
using UndertaleModLib.Compiler;

var group = new CodeImportGroup(Data) { MainThreadAction = MainThreadAction, ThrowOnNoOpFindReplace = true };
string Text(string name) => GetDecompiledText(name).Replace("\r\n", "\n");
void Replace(string name, string code) { if (Data.Code.ByName(name) == null) throw new Exception("Missing item seam: " + name); group.QueueReplace(name, code); }
string One(string code, string oldText, string newText) { if (!code.Contains(oldText)) throw new Exception("Item seam changed: " + oldText); return code.Replace(oldText, newText); }

var names = Text("gml_GlobalScript_scr_itemnamelist");
var namesEnd = names.LastIndexOf("    }\n}");
if (namesEnd < 0) throw new Exception("Item name switch changed");
Replace("gml_GlobalScript_scr_itemnamelist", names.Insert(namesEnd, "        case 16:\n            global.itemname[i] = \"Tension Bit\";\n            break;\n"));

var info = Text("gml_GlobalScript_scr_iteminfo");
var infoEnd = info.LastIndexOf("    }\n}");
if (infoEnd < 0) throw new Exception("Item info switch changed");
Replace("gml_GlobalScript_scr_iteminfo", info.Insert(infoEnd, "        case 16:\n            itemnameb = \"Tension Bit\";\n            itemdescb = \"Raises TP slightly\";\n            itemtarget = 2;\n            value = 100;\n            usable = 1;\n            break;\n"));

var use = Text("gml_GlobalScript_scr_itemuse");
var useAt = use.IndexOf("case 300:");
if (useAt < 0) throw new Exception("Item use switch changed");
Replace("gml_GlobalScript_scr_itemuse", use.Insert(useAt, "case 16:\n            usable = 0;\n            scr_speaker(\"noone\");\n            global.msg[0] = \"* (It can only be used in battle.)/%\";\n            scr_itemdialoguer();\n            break;\n        "));

var battle = Text("gml_Object_obj_battlecontroller_Step_0");
var oldUse = "if (itemtarget == 0 || itemtarget == 2)\n            {\n                scr_itemconsumeb();\n            }";
var newUse = "var br_selected_item = tempitem[global.bmenucoord[4][global.charturn]][global.charturn];\n            if (br_selected_item == 16) { scr_tensionheal(80); scr_itemshift_temp(global.bmenucoord[4][global.charturn], global.charturn); scr_nexthero(); }\n            else if (itemtarget == 0 || itemtarget == 2) scr_itemconsumeb();";
Replace("gml_Object_obj_battlecontroller_Step_0", One(battle, oldUse, newUse));
group.Import();
Console.WriteLine("Chapter 1 TP item compiled.");
