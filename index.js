let serie = "r7-series-1286";

let serieQuery = `
query Serie($serie: String!) {
    entity(guid: $serie) {
        presentationTitle
        presentationSubtitle
        type 
            art {
              nodes {
                url
              }
            }
        ... on Series {
          synopsis
          firstPublicationDate
          seasons {
            nodes {
              title
              id
            }
          }
          genres {
            nodes 
          }
          categories {
            nodes 
          }
          episodesInSeason: seasons(limit: 1, order: asc) {
                ...getEpisodes
          }
        }
    }
  }
fragment getEpisodes on SeasonList {
  nodes {
     episodes(limit: 50) {
        nodes {
            title
            description
                art {
                    nodes {
                        url
                    }
                }
            episodeNumber
            firstPublicationDate
            }
        }
  }
}
`;

let seasonQuery = `
query Season($seasonID: ID!) {
  season(id: $seasonID) {
    episodes {
    nodes {
      title
      description
      art {
        nodes {
          url
        }
      }
      episodeNumber
      firstPublicationDate
    }
  }
  }
}
`;


let currentEpisodes;
let seasonList;

fetch('https://api.ovp.tv2.dk/graphql', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        query: serieQuery,
        variables: {serie}
    }),
})
    .then(res => res.json())
    .then(res => {
        let data = res.data.entity;

        serie = {
            imageUrl: data.art.nodes[0].url,
            title: data.presentationTitle,
            desp: data.synopsis,
            genres: data.genres.nodes,
            categories: data.categories.nodes,
            type: data.type[0].toUpperCase() + data.type.slice(1),
            releaseDate: new Date(data.firstPublicationDate).getFullYear()
        };

        setBasisInformation(serie);
        setEpisodes(data.episodesInSeason.nodes[0].episodes.nodes);

        currentEpisodes = data.episodesInSeason.nodes[0].episodes.nodes;
        seasonList = data.seasons.nodes;

        populateDropdown()
    });

function populateDropdown() {
    seasonList.forEach(s => {
        let element = $('<button>').text(s.title).addClass('dropdown-item').appendTo('.dropdown-menu')
    });

    $('.dropdown-item').click(function (e) {
        let season = seasonList.filter(s => {
            return s.title === e.currentTarget.innerHTML;
        })[0];
        getEpisodesForSeason(season.id)
    })
}

function getEpisodesForSeason(seasonID) {
    fetch('https://api.ovp.tv2.dk/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            query: seasonQuery,
            variables: {seasonID}
        }),
    })
        .then(res => res.json())
        .then(res => {
            setEpisodes(res.data.season.episodes.nodes);
            currentEpisodes = res.data.season.episodes.nodes;
        });
}

function setBasisInformation(serie) {
    $('#seriesImage').attr('src', serie.imageUrl);
    $('#seriesTitle').text(serie.title);
    $('#seriesDescription').text(serie.desp);
    if (serie.genres !== "") {
        $('#genres').text(serie.categories);
    } else {
        $('#genres').text(serie.genres);
    }
    $('#type').text(serie.type);
    $('#releaseDate').text(serie.releaseDate);
}

function setEpisodes(episodes) {
    $('#episodes').empty();
    episodes.forEach(e => {
        let col = $('<div>').addClass('col md-4').appendTo($('#episodes'));
        episode = {
            title: e.title,
            description: e.description,
            releaseDate: new Date(e.firstPublicationDate).toLocaleDateString(undefined,
                {year: 'numeric', month: 'long', day: 'numeric'}),
            art: e.art.nodes[0].url,
            episodeNr: e.episodeNumber
        };
        createCardsFor(col, episode)
    });
}

function createCardsFor($container, episode) {
    let card = $('<div>').addClass('card').appendTo($container);
    let cardImage = $('<img>').attr({
        alt: "alt",
        src: episode.art,
        class: 'card-img-top'
    }).appendTo(card);
    let cardOverlay = $('<div>').addClass('card-img-overlay d-flex justify-content-end').appendTo(card);
    let overlayText = $('<p>').text(episode.episodeNr).appendTo(cardOverlay);
    let cardBody = $('<div>').addClass('card-body').appendTo(card);
    let bodyTitle = $('<h5>').text(episode.title).addClass('card-title my-0').appendTo(cardBody);
    let releaseBody = $('<p>').addClass('card-text pb-1 mb-2').appendTo(cardBody);
    let releaseDate = $('<small>').text(episode.releaseDate).addClass('text-muted').appendTo(releaseBody);
    let bodyText = $('<p>').text(episode.description).appendTo(cardBody);
};

