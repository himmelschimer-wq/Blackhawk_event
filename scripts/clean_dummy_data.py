import sqlite3

conn = sqlite3.connect(r'c:\Event website\data\blackhawk.db')
cur = conn.cursor()

# Remove test game and event
cur.execute("DELETE FROM events WHERE gameId = 'apex-legends' OR id LIKE '%mujg%' OR title LIKE '%APEX%'")
cur.execute("DELETE FROM games WHERE id = 'apex-legends'")

# Clear dummy players, registrations, and leaderboard entries
cur.execute('DELETE FROM registrations')
cur.execute('DELETE FROM leaderboard')
cur.execute('DELETE FROM players')

conn.commit()

print('Database cleaned successfully!')
for t in ['games', 'events', 'players', 'registrations', 'leaderboard']:
    cur.execute(f'SELECT count(*) FROM {t}')
    print(f'{t}: {cur.fetchone()[0]} rows')
