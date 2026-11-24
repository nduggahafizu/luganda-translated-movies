// Poster wall: posters from the Unruly Movies catalogue (TMDB poster paths).
// Only as many tiles as fit the screen are created, so phones load far fewer images.
(function () {
    var POSTERS = [
        '5rhTDKUhPYvpdQIijFIs5VoWsON', 'gAgWJhUSQWCgtKR8170nMkYlBda', 'f9Anudrk4WFkJf91BGqTXl5rodI',
        '4KaPZSKnInnArErTTgy9Oy14leR', 'kNxRgcTeqeU5jauBackTERoO2De', '5cgEwgV878aqjTxbEApfeGRNvxl',
        'krVa7rKCQb4OBfsr2LTJv4rTz5q', 'iXMvYIlzzJBs352CfeiQcBvovZt', '6sYemVUn79UPKz1ZsSG6kPU4RVy',
        'faRGb9SuyGuZpsNRoIxoVSLLCId', '3ENhExiD2fcjk5FX0AcAXcvLu9N', 'Aqth7r2pr79YPYj6WPGDs23F4Wb',
        'uW5YMPxJUzT9bkafrCKHXjPTCoQ', 'j04Oepj3LGTWSb1ltXm0pcy50Xq', 'OG0mxQt4YaNIWiz8EKJSHe9lPh',
        'bjiS5ipwxb9JFy3XRRN4OAilSeX', 'bcK5naYzzfY0JBCgrPrsrbV6NO1', '3teWChNzKJdbfen46IdeKTygdZa',
        'lkc4PkMhxsQUTs9NnM8hmYNP4M1', 'fgSm5ylwiXbIHn8UbUXDjk9RRu4', 'oWT70TvbsmQaqyphCZpsnQR7R32',
        'bNErActDctl6cdUGw9pnjSCmyhQ', 'lnWkyG3LLgbbrIEeyl5mK5VRFe4', 'eXjk4W4robXs7l1YXwaXMv4f2qb',
        '5Xc7WpWsgflfgEMoBlf9TmWhfbH', 'wUqUxv3ZhF1spAx4HLxhP1NUK8G', 'rzpHPSEgPTpRs8EHbygwsOw7jC0',
        '7yUY1HUyQuybbvkAAhLzQ7x1l9g', 'e9ziA4Y6md4Ytr62r5y9vRdv4ll', 'kMMWb4zIZKBnO3lOpVBXCL1BeNI',
        'jhs5B2aD00TmvWkUkd9ImcYwurw', 'nOj4nsomFyAVJgpp68L0xq3cREc', 'krKymFF2Whxk4mk02jlLXgE3JGH',
        '8VW9mR2YIS2YORfTHcJy9VLZmeu', 'cx9AOBOv9Qf5ufZYQMbfTV7w7VY', '71JMWqNDRz2Au59JYosfn5W8nuS',
        'fP4nBrtmc0teSDDHzYmDE7TLQBT', 'onBy6iJt3BX8MSc7GjzIRgE07oV', 'uHNuUIdF35dRSLQQ5Ej0aOhmvB3',
        'unJWfg66bFwrGD31nBFoOQfkuba', 'idT5mnqPcJgSkvpDX7pJffBzdVH', 'qJ4UV7YnAweTjosfSzDG80j1nd0',
        'x6rHcQFiYcczLQPrmxXPAicm54E', 'ul4dQcA68mtSx8J56N5gEcaCCtP', '7NrvUI3vnW8H3rD7ExKcTL7KRcQ',
        'zP19YO60jwEsfKd5Qf1UvA5uJu8', 'irLwtIARtLqnWbtOZifsqAJWFQo', 'n3ZnFqp988MWfIkT8OHofEJfjlt',
        'fDEdtS4P0gJsxHDIt8dG8TR5dx1', 'zAVFOLcjqYoEDYBF7UPNY4DIV2I', 'tlPgDzwIE7VYYIIAGCTUOnN4wI1',
        'uRI6pASQX30W1Jv8JEWVFh2Rya2', 'rwaxLuOkJ5mMvJU5juNaPcKADOW', '9Bu1PW2R1XayqRqnl0aDOgMcrdS',
        'gDTZNcZj4Kg7Dcu4becTshfTyAS', 'z8pfWCk6SlxxDLXXQdUHdxF5dwJ', 'j3rUkHIAAoKr6jU30q3Db4fcIF9',
        'gnAsZvBygplNpp8PtjoTEYv3VPB', 'qYBCs9nBmdNCLduw5BTlendq89z', '7D430eqZj8y3oVkLFfsWXGRcpEG',
        'rhOht22ySr8njixjsD7FDx2idnm', 'uiiXHBd9oUrtUa4YqZiAoy05cRz', '5Onf4TW3mZn3oLeKVr9W4FGomQQ',
        'sNjL6SqErDBE8OUZlrDLkexfsCj', 'nBM9MMa2WCwvMG4IJ3eiGUdbPe6', '3ndAx3weG6KDkJIRMCi5vXX6Dyb',
        'kZ2nZw8D681aphje8NJi8EfbL1U', 'dmJW8IAKHKxFNiUnoDR7JfsK7Rp', 'gajva2L0rPYkEWjzgFlBXCAVBE5',
        'pEzNVQfdzYDzVK0XqxERIw2x2se', 'c7btGYblBnfAaw713WvFM0Kimc7', '8R79AZjX1Bt4219Ub3CrRMsPQsW',
        '9GWyiezidQZohNOgt4dWGgrKnNv', 'p4RafgAPk558muOjnBMHhMArjS2', 'c2GKN4VHCj1dnjFMANRpGkCVBae',
        'AbunjMKX4P1sDNlKfhYrWkIoRD9', 'lIsMeDbwntNXSUVHmWMMRXEZOVc', 'z3MXFdFjrYmoxOEFgE1wuphwo2a',
        'nV5316WUsVij8sVXLCF1g7TFitg', '5MHtxPEfmN4b0rHzfEZRcm6v9WI', 'gFjEggtrejCN79r6SXRjM269OtG'
    ];

    var grid = document.getElementById('posterGrid');
    if (!grid) return;

    // Shuffle so the wall looks different on every visit
    for (var i = POSTERS.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = POSTERS[i]; POSTERS[i] = POSTERS[j]; POSTERS[j] = t;
    }

    var made = 0;

    function tilesNeeded() {
        var cs = getComputedStyle(grid);
        var colW = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tile-w')) || 150;
        var gap = parseFloat(cs.columnGap) || 10;
        var w = grid.clientWidth, h = grid.clientHeight;
        var cols = Math.max(1, Math.floor((w + gap) / (colW + gap)));
        var rows = Math.ceil((h + gap) / (colW * 1.5 + gap)) + 1;
        return cols * rows;
    }

    function fill() {
        var need = tilesNeeded();
        var frag = document.createDocumentFragment();
        for (; made < need; made++) {
            var tile = document.createElement('div');
            tile.className = 'poster-tile';
            frag.appendChild(tile);
            (function (el, path) {
                var img = new Image();
                img.onload = function () {
                    el.style.backgroundImage = 'url("' + img.src + '")';
                    el.classList.add('is-loaded');
                };
                img.src = 'https://image.tmdb.org/t/p/w154/' + path + '.jpg';
            })(tile, POSTERS[made % POSTERS.length]);
        }
        grid.appendChild(frag);
    }

    fill();
    var resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(fill, 200);
    });
})();
