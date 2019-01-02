$(document).ready(function () {

    fillSelectFavoris(); //fill favorites list

    $('#searchBtn').on('click', function (e) {
        let repoName = $('#searchRepo').val();
        $('#myFavoris').val('');//set select to default value
        getRepositories(repoName);
        $("#container").show();

    });


    $('#myFavoris').on('change', function (e) {
        $('#searchRepo').val('');//reset value of search input

        getRepositories(this.value, true);
        $("#container").show();
    });

});


function getRepositories(repositoryName, fromFavorit = false) {
    //initial
    $('#contributors').html('');
    $('#commits').html('');
    createLineChart([], []);

    $('#overlay').show(); //display loader

    // Make request to Github
    $.ajax({
        url: 'https://api.github.com/search/repositories?q=' + repositoryName + ' in:name&sort=stars&order=desc',
        data: {
            client_id: 'b9315bcd5a07fcd759d8',
            client_secret: 'a2b698bf7e7c02f898197cf136d1a41f704ca8e4'
        }
    }).done(function (repos) {

        $('#repos').html('');
        $('#reposCount').html(repos.items.length); // display count of repos in span

        $.each(repos.items, function (index, repo) {
            if (existeInFavorites(repo.owner.login + "/" + repo.name)) {
                imageTag = `<img class="icon-fav"  src="icon/ok.png"  title="mes favoris">`;
            }
            else {
                imageTag = `<img class="icon-fav"  id="ficon${index}" src="icon/add-to-favorites.png" onclick ="addToFavories('${repo.owner.login}/${repo.name}','ficon${index}')" title="ajouter à la liste des favoris">`;
            }

            $('#repos').append(`
             <div class="list-group-item repos${index}" >
            <a href="#" class="repos${index} my-list-group-item"  onclick="getContributors('${repo.owner.login}/${repo.name}');activedItem('repos','repos${index}')">
              <h4 class="list-group-item-heading">${repo.name}</h4>
               <p class="list-group-item-text">${repo.description}</p>
            </a>
            <div class="div-icon-fav">${imageTag}</div>
            </div>
           `);
        });
        //if event from selec my favorites
        if (fromFavorit) {
            let repository = repos.items[0];
            getContributors(repository.owner.login + '/' + repository.name);
            activedItem('repos', 'repos0');
        }

        $('#overlay').hide(); //hide loader
    });

}

function getContributors(argument) {

    $('#overlay').show(); //display loader
    // Make request to Github
    $.ajax({
        url: 'https://api.github.com/repos/' + argument + '/contributors',
        data: {
            client_id: 'b9315bcd5a07fcd759d8',
            client_secret: 'a2b698bf7e7c02f898197cf136d1a41f704ca8e4'
        }
    }).done(function (contributors) {

        $('#contributors').html('');
        $('#contributorsCount').html(contributors.length); // display count of contributors in span

        $.each(contributors, function (index, contributor) {
            $('#contributors').append(`
             <a href="#" class="list-group-item contributor${index}" onclick="getCommits('${argument}','${contributor.login}');activedItem('contributors','contributor${index}')">
             <div class="row">
             <div class="col-md-4">
             <img class="avatar" src="${contributor.avatar_url}">
             </div>
             <div class="col-md-8">
               <h5 class="list-group-item-heading">${contributor.login}</h5> 
               <p class="list-group-item-text">${contributor.contributions} contributions</p>
             </div>
             </div>
             </a>
           `);
        });

        activedItem('contributors', 'contributor0');//colored first item
        getCommits(argument, contributors[0].login);

        $('#overlay').hide(); //hide loader

    });
}

function getCommits(argument, author) {

    $('#overlay').show(); //display loader

    // Make request to Github
    $.ajax({
        url: 'https://api.github.com/repos/' + argument + '/commits?author=' + author,
        data: {
            client_id: 'b9315bcd5a07fcd759d8',
            client_secret: 'a2b698bf7e7c02f898197cf136d1a41f704ca8e4'
        }
    }).done(function (commits) {


        $('#commits').html('');
        $('#commitsCount').html(commits.length); // display count of commits in span

        let dates = [];
        let j = 0;
        $.each(commits, function (index, commitObj) {
            $('#commits').append(`
             <span class="list-group-item">
               <h5 class="list-group-item-heading">${commitObj.commit.author.date}</h5> 
               <p class="list-group-item-text">${commitObj.commit.message}</p>
             </span>
           `);
            dates.unshift((commitObj.commit.author.date).substring(0, 7)); // get YYYY-MM exp: ['2017-04','2017-04','2017-05','2017-06', ...]
            j++;
            if (j == 100) return false; // for get lasts 100 commit        
        });

        var duplicateCount = {};
        dates.forEach(function (i) { duplicateCount[i] = (duplicateCount[i] || 0) + 1; }); //count duplicate date exp : {2017-04:5,2017-05:20,2017-06:11, ....}

        let commitsDate = Object.keys(duplicateCount);//set keys of duplicateCount object in array exp :['2017-04','2017-05','2017-06', ...]
        let commitsCount = Object.values(duplicateCount);//set values of duplicateCount object in array exp :[5,20,11, ...]

        createLineChart(commitsDate, commitsCount); // for draw chart
        $('#overlay').hide(); //hide loader
    });
}

function createLineChart(Labels, CommitsData) {

    //-------------
    //- LINE CHART -
    //--------------
    let monthsShort = { '01': "Jan", '02': "Fev", '03': "Mar", '04': "Avr", '05': "Mai", '06': "Jui", '07': "Juil", '08': "Aoû", '09': "Sep", '10': "Oct", '11': "Nov", '12': "Dec" };
    let splited = [];
    let commitsLabels = [];

    Labels.forEach(function (element) {
        splited = element.split("-");
        commitsLabels.push(monthsShort[splited[1]] + ' ' + splited[0]);
    });

    var areaChartData = {
        type: 'line',
        data: {
            labels: commitsLabels,
            datasets: [
                {
                    data: CommitsData,
                    label: "Commits",
                    borderColor: "#F00",
                    fill: false
                }
            ]
        },
        options: {
            legend: { display: false },
            title: {
                display: true,
                text: 'Commits statistics'
            }
        }
    };

    new Chart($("#lineChart"), areaChartData);

}

function activedItem(divId, itemclass) {
    $("#" + divId).find(".active").removeClass("active");
    $("." + itemclass).addClass("active");
}

function addToFavories(favori, imgId) {
    //store names of favorites repositories in local storage
    var myFavorites = JSON.parse(localStorage.getItem("favoris"));

    if (!myFavorites) {
        localStorage.setItem('favoris', JSON.stringify([favori]));
    } else {

        if ($.inArray(favori, myFavorites) != -1) {
            alert('Favori existe')
        }
        else {
            myFavorites.push(favori);
            localStorage.setItem('favoris', JSON.stringify(myFavorites));
            $("#" + imgId).attr("src", "icon/ok.png");
            $("#" + imgId).attr("title", "mes favoris");
            $("#" + imgId).attr("onclick", "");
            $("#myFavoris").append($("<option />").val(favori).text(favori.split('/')[1]));//add new favorite to select list
        }
    }

}


function existeInFavorites(repo) {

    var myFavorites = JSON.parse(localStorage.getItem("favoris"));
    
    if (myFavorites && $.inArray(repo, myFavorites) != -1) {
        return true
    }
    return false;
}


function fillSelectFavoris() {

    var myFavorites = JSON.parse(localStorage.getItem("favoris"));
    var favoris_list = $("#myFavoris");
    favoris_list.html('<option value="">Selectionner</option>');

    $.each(myFavorites, function () {
        favoris_list.append($("<option />").val(this).text(this.split('/')[1]));
    });

}

