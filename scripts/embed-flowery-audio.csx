using UndertaleModLib;
using UndertaleModLib.Models;
var wavPath=System.Environment.GetEnvironmentVariable("BOSSROOM_FLOWERY_WAV");
if(string.IsNullOrEmpty(wavPath)||!System.IO.File.Exists(wavPath))throw new System.Exception("Set BOSSROOM_FLOWERY_WAV to the decoded stereo PCM WAV.");
foreach(var entry in Data.Sounds)if(entry.Name.Content=="snd_bossroom_flowery_music")throw new System.Exception("Track already embedded");
var audio=new UndertaleEmbeddedAudio{Name=new UndertaleString("bossroom_flowery_pcm"),Data=System.IO.File.ReadAllBytes(wavPath)};
Data.EmbeddedAudio.Add(audio);
Data.Sounds.Add(new UndertaleSound{Name=Data.Strings.MakeString("snd_bossroom_flowery_music"),Type=Data.Strings.MakeString(".wav"),File=Data.Strings.MakeString("bossroom_flowery_music.wav"),Flags=UndertaleSound.AudioEntryFlags.Regular|UndertaleSound.AudioEntryFlags.IsEmbedded,Volume=1,Pitch=1,Preload=true,AudioGroup=Data.AudioGroups[0],AudioFile=audio,AudioLength=192.023438f});
System.Console.WriteLine("Embedded Flowery PCM bytes="+audio.Data.Length);
