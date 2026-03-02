#!/usr/bin/env python3
"""
CLI Tool to Add Movies to Unruly Movies
Run: python3 add-movie.py
"""

import json
import urllib.request
import urllib.parse
import ssl
import getpass
import time

API_URL = 'https://luganda-translated-movies-production.up.railway.app'

# Disable SSL verification for simplicity (Railway uses valid certs anyway)
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

def request(url, method='GET', data=None, headers=None):
    """Make HTTP request"""
    if headers is None:
        headers = {}
    
    if data:
        data = json.dumps(data).encode('utf-8')
        headers['Content-Type'] = 'application/json'
    
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req, context=ssl_context, timeout=30) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        try:
            return json.loads(e.read().decode('utf-8'))
        except:
            return {'success': False, 'message': str(e)}
    except Exception as e:
        return {'success': False, 'message': str(e)}

def search_tmdb(query, search_type='movies'):
    """Search TMDB via Railway proxy"""
    endpoint = 'search/tv' if search_type == 'tv' else 'search/movies'
    url = f"{API_URL}/api/tmdb/{endpoint}?query={urllib.parse.quote(query)}"
    
    print('\n🔍 Searching TMDB...')
    result = request(url)
    
    if result.get('success') and result.get('data', {}).get('results'):
        return result['data']['results']
    return []

def get_movie_details(movie_id, media_type='movie'):
    """Get full movie details"""
    url = f"{API_URL}/api/tmdb/{media_type}/{movie_id}"
    result = request(url)
    return result.get('data', result)

def login(email, password):
    """Login to admin"""
    print('\n🔐 Logging in...')
    result = request(f"{API_URL}/api/auth/login", method='POST', data={
        'email': email,
        'password': password
    })
    
    # Check various response formats
    if result.get('token'):
        return result['token']
    if result.get('data', {}).get('token'):
        return result['data']['token']
    if result.get('success') and result.get('accessToken'):
        return result['accessToken']
    
    # Debug: print the actual response
    print(f"DEBUG - Login response: {result}")
    
    raise Exception(result.get('message', 'Login failed - no token in response'))

def add_movie(token, movie_data):
    """Add movie to database using the simple-add endpoint"""
    print('\n📤 Uploading movie...')
    
    # Use the simple-add endpoint which has less strict validation
    result = request(f"{API_URL}/api/luganda-movies/simple-add", method='POST', data=movie_data, headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    })
    
    # Print validation errors if any
    if result.get('errors'):
        print('\n⚠️ Validation errors:')
        for err in result['errors']:
            print(f"   - {err.get('path', err.get('param', 'field'))}: {err.get('msg', err.get('message', 'invalid'))}")
    
    return result

# VJ List
VJ_LIST = [
    'Vj Jovan', 'Vj Tom', 'Vj Shao Khan', 'Vj Kevo', 'Vj Kevin',
    'Vj Kriss Sweet', 'Vj Hd', 'Vj Dan De', 'Vj Sammy', 'Vj Ivo',
    'Vj Isma K', 'VJ Junior', 'VJ Ice P', 'VJ Emmy', 'VJ Jingo',
    'Vj Little T', 'Vj Mox', 'Vj Muba', 'Vj Eddy', 'Vj Kam',
    'Vj Lance', 'Vj KS', 'Vj Ulio', 'Vj Aaron', 'Vj Cabs',
    'Vj Banks', 'Vj Jimmy', 'Vj Baros', 'Vj Kimuli', 'Vj Fredy',
    'Vj Jumpers', 'Vj Ashim', 'Vj Pauleta', 'Vj Martin K', 'Vj Henrico',
    'Vj Uncle T', 'Vj Soul', 'Vj Nelly'
]

def main():
    print('═' * 55)
    print('   🎬 UNRULY MOVIES - Add New Movie (CLI)')
    print('═' * 55)
    print()
    
    token = None
    
    try:
        # Login
        email = input('📧 Admin Email: ')
        password = getpass.getpass('🔑 Password: ')
        
        token = login(email, password)
        print('✅ Login successful!\n')
        
        while True:
            print('\n' + '─' * 55)
            
            # Search TMDB
            search_query = input('\n🔍 Search movie title (or "quit" to exit): ').strip()
            
            if search_query.lower() == 'quit':
                print('\n👋 Goodbye!')
                break
            
            if not search_query:
                continue
            
            type_choice = input('📺 Type (1=Movie, 2=TV Series) [1]: ').strip()
            search_type = 'tv' if type_choice == '2' else 'movies'
            
            results = search_tmdb(search_query, search_type)
            
            if not results:
                print('❌ No results found. Try a different search.')
                continue
            
            # Display results
            print('\n📋 Search Results:')
            for i, item in enumerate(results[:8], 1):
                title = item.get('title') or item.get('name', 'Unknown')
                date = item.get('release_date') or item.get('first_air_date', '')
                year = date.split('-')[0] if date else 'N/A'
                print(f"  {i}. {title} ({year})")
            
            choice = input('\n👉 Select number (or 0 to search again): ').strip()
            
            try:
                choice_num = int(choice)
            except:
                continue
            
            if choice_num < 1 or choice_num > len(results[:8]):
                continue
            
            selected = results[choice_num - 1]
            media_type = 'tv' if selected.get('first_air_date') else 'movie'
            
            # Get full details
            print('\n📥 Fetching details...')
            details = get_movie_details(selected['id'], media_type)
            
            title = details.get('title') or details.get('name', 'Unknown')
            date = details.get('release_date') or details.get('first_air_date', '')
            year = date.split('-')[0] if date else 'N/A'
            
            print('\n📽️ Movie Details:')
            print(f"   Title: {title}")
            print(f"   Year: {year}")
            print(f"   Runtime: {details.get('runtime', 'N/A')} min")
            print(f"   Rating: {details.get('vote_average', 'N/A')}")
            overview = details.get('overview', '')[:100]
            print(f"   Overview: {overview}...")
            
            # VJ Selection
            print('\n🎤 VJ Translators:')
            for i in range(0, len(VJ_LIST), 4):
                row = VJ_LIST[i:i+4]
                row_str = '  '.join(f"{i+j+1:2}. {vj:<14}" for j, vj in enumerate(row))
                print(f"  {row_str}")
            
            vj_choice = input('\n👉 Select VJ number: ').strip()
            
            try:
                vj_num = int(vj_choice)
                vj_name = VJ_LIST[vj_num - 1] if 0 < vj_num <= len(VJ_LIST) else 'Unknown VJ'
            except:
                vj_name = 'Unknown VJ'
            
            # Video URL
            print('\n📺 Video URL Options:')
            print('  - Archive.org: https://archive.org/download/ITEM_ID/video.mp4')
            print('  - Streamtape, Doodstream, etc.')
            print('  (Paste the URL and press Enter)')
            
            video_url = ''
            while not video_url:
                try:
                    video_url = input('\n🔗 Video URL: ').strip()
                    # Clean up URL - remove any control characters
                    video_url = ''.join(c for c in video_url if c.isprintable())
                except EOFError:
                    continue
            
            if not video_url or video_url.lower() in ['quit', 'exit', 'q']:
                print('❌ Video URL is required!')
                continue
            
            # Featured/Trending options
            print('\n⭐ Movie Status:')
            print('  1. Normal (just add to library)')
            print('  2. Featured (show on homepage carousel)')
            print('  3. Trending (show in trending section)')
            print('  4. Both Featured & Trending')
            
            status_choice = input('\n👉 Select status [1]: ').strip() or '1'
            is_featured = status_choice in ['2', '4']
            is_trending = status_choice in ['3', '4']
            
            # Build movie data for simple-add endpoint
            poster_path = details.get('poster_path', '')
            backdrop_path = details.get('backdrop_path', '')
            genres = [g['name'].lower() for g in details.get('genres', [])]
            if not genres:
                genres = ['action']  # Default genre
            
            # Get director from credits if available
            director = 'Unknown'
            credits = details.get('credits', {})
            if credits:
                crew = credits.get('crew', [])
                for person in crew:
                    if person.get('job') == 'Director':
                        director = person.get('name', 'Unknown')
                        break
            
            movie_duration = details.get('runtime', 0) or 90  # Default 90 min if not available
            
            # Simple-add endpoint expects these fields
            movie_data = {
                'originalTitle': title,
                'lugandaTitle': f"{title} (Oluganda)",
                'vjName': vj_name,
                'embedUrl': video_url,  # This is the key field for simple-add
                'year': int(year) if year.isdigit() else 2024,
                'duration': movie_duration,
                'description': details.get('overview', 'No description available') or 'A great movie translated to Luganda.',
                'director': director,
                'poster': f"https://image.tmdb.org/t/p/w500{poster_path}" if poster_path else None,
                'backdrop': f"https://image.tmdb.org/t/p/original{backdrop_path}" if backdrop_path else None,
                'genres': genres,
                'featured': is_featured,
                'trending': is_trending,
                'tmdbId': details.get('id'),
                'trailer': None
            }
            
            # Confirm
            print('\n📋 Movie Summary:')
            print(f"   Title: {movie_data['originalTitle']}")
            print(f"   VJ: {movie_data['vjName']}")
            print(f"   Year: {movie_data['year']}")
            print(f"   Duration: {movie_data['duration']} min")
            print(f"   Director: {movie_data['director']}")
            print(f"   Genres: {', '.join(movie_data['genres'])}")
            status_labels = []
            if is_featured: status_labels.append('⭐ Featured')
            if is_trending: status_labels.append('🔥 Trending')
            if status_labels:
                print(f"   Status: {', '.join(status_labels)}")
            print(f"   Video: {movie_data['embedUrl'][:60]}...")
            
            # Clear any buffered input and get fresh confirmation
            time.sleep(0.2)  # Small delay to let paste buffer clear
            
            print('\n' + '-' * 40)
            confirm = ''
            while confirm not in ['y', 'n', 'yes', 'no']:
                confirm = input('✅ Upload this movie? Type "y" or "n": ').strip().lower()
                confirm = ''.join(c for c in confirm if c.isalnum())  # Keep only letters/numbers
            
            if confirm in ['y', 'yes']:
                result = add_movie(token, movie_data)
                
                if result.get('status') == 'success' or result.get('success'):
                    print('\n🎉 Movie uploaded successfully!')
                else:
                    print(f"\n❌ Upload failed: {result.get('message', 'Unknown error')}")
            else:
                print('❌ Cancelled by user.')
        
    except KeyboardInterrupt:
        print('\n\n👋 Goodbye!')
    except Exception as e:
        print(f'\n❌ Error: {e}')

if __name__ == '__main__':
    main()
