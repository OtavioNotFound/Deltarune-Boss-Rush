var br_text = clipboard_get_text();
if (string_copy(br_text, 1, 8) == "BRPARTY:")
{
    global.br_packet = json_parse(string_delete(br_text, 1, 8));
    global.br_active = global.br_packet.active == 1;
    global.br_owners = global.br_packet.owners;
    for (var bs = 0; bs < 3; bs++)
    {
        for (var bk = 0; bk < 10; bk++)
        {
            var next = global.br_packet.held[bs][bk];
            global.br_pressed[bs][bk] = next == 1 && global.br_held[bs][bk] == 0;
            global.br_released[bs][bk] = next == 0 && global.br_held[bs][bk] == 1;
            global.br_held[bs][bk] = next;
        }
    }
}
else global.br_active = false;
if (global.br_active)
{
    var br_seat = 0;
    if (variable_global_exists("charturn") && global.charturn >= 0 && global.charturn < 3)
    {
        var br_char = global.char[global.charturn];
        if (br_char > 0 && br_char <= 3) br_seat = global.br_owners[br_char - 1];
    }
    global.br_set_input(br_seat);
}
else
{
    // Remove only cloned hearts; the original resumes native solo behavior.
    with (obj_heart) if (variable_instance_exists(id, "br_extra") && br_extra) instance_destroy();
}
