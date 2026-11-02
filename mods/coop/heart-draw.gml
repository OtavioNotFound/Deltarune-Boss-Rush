if (global.br_active)
{
    var colors = [c_red, c_fuchsia, c_aqua];
    var old_color = draw_get_color();
    var old_alpha = draw_get_alpha();
    draw_set_color(colors[br_owner]);
    draw_set_alpha(image_alpha * (br_owner == global.br_local_seat ? 1 : 0.28));
    // Native red pixels cannot be recolored by multiplication; draw a matching
    // pixel silhouette while keeping the original sprite's collision mask.
    if (br_inv < 0 || floor(br_inv / 3) mod 2 == 0)
    {
        var rows = [102, 255, 255, 126, 60, 24, 0, 0];
        for (var row = 0; row < 8; row++)
            for (var col = 0; col < 8; col++)
                if (floor(rows[row] / power(2, col)) mod 2 == 1)
                    draw_rectangle(x + (2 + col * 2) * image_xscale, y + (2 + row * 2) * image_yscale,
                        x + (3 + col * 2) * image_xscale, y + (3 + row * 2) * image_yscale, false);
    }
    draw_text(x, y - 14, "J" + string(br_owner + 1));
    draw_set_color(old_color);
    draw_set_alpha(old_alpha);
    exit;
}
