// Runtime-only bridge. No system clipboard is read by the browser adapter.
global.br_active = false;
global.br_packet = { active: 0 };
global.br_owners = [0, 0, 0];
global.br_held = array_create(3);
global.br_pressed = array_create(3);
global.br_released = array_create(3);
for (var bs = 0; bs < 3; bs++)
{
    global.br_held[bs] = array_create(10, 0);
    global.br_pressed[bs] = array_create(10, 0);
    global.br_released[bs] = array_create(10, 0);
}
global.br_spawn = -1;
global.br_hit_owner = -1;
global.br_hit_heart = noone;
global.br_primary = noone;
global.br_target = function(seat, preferred)
{
    if (preferred >= 0 && preferred < 3)
    {
        var ch = global.char[preferred];
        if (ch > 0 && ch <= 3 && global.br_owners[ch - 1] == seat && global.hp[ch] > 0) return preferred;
    }
    for (var slot = 0; slot < 3; slot++)
    {
        var ch = global.char[slot];
        if (ch > 0 && ch <= 3 && global.br_owners[ch - 1] == seat && global.hp[ch] > 0) return slot;
    }
    return -1;
};
global.br_set_input = function(seat)
{
    for (var k = 0; k < 10; k++)
    {
        global.input_held[k] = global.br_held[seat][k];
        global.input_pressed[k] = global.br_pressed[seat][k];
        global.input_released[k] = global.br_released[seat][k];
    }
};
