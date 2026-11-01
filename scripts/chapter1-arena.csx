using System.Linq;
using UndertaleModLib.Models;
// The chapter 1 test room is an empty 2x2 placeholder. Use the native boss room.
var room=Data.Rooms.Single(r=>r.Name.Content=="room_cc_joker");
var keep=room.GameObjects.Where(o=>o.ObjectDefinition.Name.Content=="obj_mainchara"||o.ObjectDefinition.Name.Content=="obj_darkcontroller"||o.ObjectDefinition.Name.Content=="obj_jokerbg_triangle_real").ToHashSet();
foreach(var layer in room.Layers)if(layer.Data is UndertaleRoom.Layer.LayerInstancesData instances)
 foreach(var instance in instances.Instances.ToArray())if(!keep.Contains(instance))instances.Instances.Remove(instance);
foreach(var instance in room.GameObjects.ToArray())if(!keep.Contains(instance))room.GameObjects.Remove(instance);
room.CreationCodeId=null;room.DrawBackgroundColor=true;room.BackgroundColor=0xFF000000;
System.Console.WriteLine("Chapter 1 arena: "+room.Width+"x"+room.Height+", instances="+room.GameObjects.Count);
