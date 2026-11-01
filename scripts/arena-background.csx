foreach (var arena in Data.Rooms)
{
    if (arena.Name.Content == "room_battletest")
    {
        arena.DrawBackgroundColor = true;
        arena.BackgroundColor = 0xFF000000;
    }
}
