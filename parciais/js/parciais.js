$(document).ready(function() {
	acionarBotoesOrdenacao();
	var	resultado = {},
		pagina = 1,
		qtd_times = 0;
	
	resultado = buscarLiga(pagina);
	qtd_times = resultado.liga.total_times_liga;
	num_paginas = Math.ceil(qtd_times/20);
	
	// para num_paginas menor e igual a 1 já está feito
	timesObjetos = resultado.times;	
	while(pagina < num_paginas) {
		pagina++;
		resultado = buscarLiga(pagina);
		
		for(var x in resultado.times) {
			timesObjetos.push(resultado.times[x]);
		}
	}

	searchTeam();
});

var atletas_pontuados = null;
var rodada_atual = 0;
var mercado_status = 0;
var timesObjetos = [];
var linhas = [];

statusMercado();
statusParciaisRodada();

function buscarLiga(pagina) { 
	var resultado = {};
	
	$.ajax({
    	type: "GET",
	    contentType: "application/json",
	    cache: false,
	    url: "load-api-auth.php",
	    timeout: 10000,
	    data: {
			api: "liga",
			page: pagina,
			liga_slug: "ases-fortaleza-ceara"
	    },
	    async: false,
	    success: function(value) {
	    	resultado = value;
	    },
	    error: function (jqXHR, textStatus, errorThrown) {
	        alert("Falha ao obter dados.");
	    	return false;
	    }
    });

	return resultado;
}

function searchTeam() {
	var team_input = ['ftfc','nathansccp','vozao-da-manibura','copobemafc','vasco-fortalezense','lpgfc','papapenta','marujinho-fc','whippet-fc','junior-black-fut','lzn-s-fc','mim-acher-fussball-club','dlfmecao','vozaosc1914','andre-rosario-fc','flabreu','f-s-c','charles-weyne','tabajara-cearense','quetelle-fc','metalmania-fc'];

    if (team_input == null || team_input.length == 0) {
    	alert('Nenhum time na liga');
    	return false;
    }

    for(var i = 0; i < team_input.length; i++) {
    	linhas.push(requisicao(team_input[i]));
    }
    
    linhas.sort(function(a, b) {
	    return (parseFloat(b.pontuacaoGeral)+parseFloat(b.pontuacao)) - (parseFloat(a.pontuacaoGeral)+parseFloat(a.pontuacao));
	});
    
    apresentarResultado(linhas);
}

function apresentarResultado(linhas) {
	var index = 1;
	
	$("#tabela-pontos tbody").empty();
	
    for(var x in linhas) {
    	var id_nome = linhas[x].slug + "_nome",
			id_pontuacao = linhas[x].slug + "_pontuacao",
			id_qtd_pontuados = linhas[x].slug + "_pontuados",
			id_pontuacao_geral = linhas[x].slug + "_pontuacao_geral",
			id_pontuacao_soma = linhas[x].slug + "_pontuacao_soma",
			linha = (index % 2 != 0) ? "<tr>" : "<tr class='pure-table-odd'>";
    	
    	linha += "<td>" + index + "</td><td id=" + id_nome + "></td><td id=" + id_qtd_pontuados + "></td><td id=" + id_pontuacao + "></td><td id=" + id_pontuacao_geral + "></td><td id=" + id_pontuacao_soma + "></td></tr>";
    	$("#tabela-pontos tbody").append(linha);
	
		var _team_nome = $("#"+id_nome),
			_team_pontuacao = $("#"+id_pontuacao),
		    _team_pontuados = $("#"+id_qtd_pontuados),
		    _team_pontuacao_geral = $("#"+id_pontuacao_geral),
			_team_pontuacao_soma = $("#"+id_pontuacao_soma),
			pontuacaoSoma = parseFloat(linhas[x].pontuacao) + parseFloat(linhas[x].pontuacaoGeral);
		
    	_team_nome.html(linhas[x].nomeTime);
        _team_pontuacao.html(linhas[x].pontuacao);
        _team_pontuados.html(linhas[x].pontuados);
        _team_pontuacao_geral.html(linhas[x].pontuacaoGeral);
        _team_pontuacao_soma.html(pontuacaoSoma.toFixed(2));
        
        index += 1;
    }
}

function requisicao(slug_time) {
	var parcial = null;
	
	$.ajax({
    	type: "GET",
	    contentType: "application/json",
	    cache: false,
	    url: "load-api.php",
	    timeout: 10000,
	    data: {
	    	api: "busca-atletas",
	    	team_slug: slug_time
	    },
	    async: false,
	    success: function(time) {
	    	//retorna um objeto que presenta uma parcial
	    	parcial = analisarTime(time);	      
	    },
	    error: function (jqXHR, textStatus, errorThrown) {
	    	alert("Falha ao obter dados.");
	    	return false;
	    }
    });
	
	return parcial;
}

function analisarTime(time) {
	// team
	var team = (time.time == "" ? "---" : time.time),
	    team_nome = (team.nome == "" ? "---" : team.nome);
	
    //parcial
    var parcial = analisarAtletas(time);
    parcial.slug = time.time.slug;
    parcial.nomeTime = team_nome;
    parcial.pontuacaoGeral = obterPontuacaoNoCampeonato(time);
    
    return parcial;
}

function analisarAtletas(time) {
	var parcial = {},
		athletes = time.atletas,
    	_team_rodada = $(".team_rodada"),
    	qtd_pontuados = 0;
    
    if (typeof athletes !== "undefined" && athletes != null && athletes.length > 0) {
    	
        // rodada info
        var team_rodada = (mercado_status == 1) ? athletes[0].rodada_id : rodada_atual;
        _team_rodada.html(team_rodada + "a Rodada");
        
        // pontuacao total do time
        var team_pontuacao = 0;
        if (mercado_status == 1) {
          team_pontuacao = (time.pontos == null) ? team_pontuacao : time.pontos;
        }
        
        // loop nos atletas
        $.each(athletes, function(inc, athlete) {
            
            // mercado fechado, pega pontuacao dos atletas da rodada em andamento
            if (mercado_status == 2 || mercado_status == 3) {
            	if(atletas_pontuados != null && typeof atletas_pontuados[athlete.atleta_id] !== "undefined" && atletas_pontuados[athlete.atleta_id].pontuacao != 0) {
            		team_pontuacao += atletas_pontuados[athlete.atleta_id].pontuacao;
            		qtd_pontuados += 1;
            	}
            }
        });
        
        // time parcial
        parcial = {slug: "", nomeTime:"", pontuacao: team_pontuacao.toFixed(2), pontuados: qtd_pontuados, pontuacaoGeral: 0, pontuacaoSoma: 0};
    }
    
    return parcial; 
}

function obterPontuacaoNoCampeonato(time) {
	var slug = time.time.slug,
		pontos = 0;
	
	for(var x in timesObjetos) {
		if(timesObjetos[x].slug == slug) {
			pontos = timesObjetos[x].pontos.turno;
			pontos = pontos.toFixed(2);
			break;
		}
	}
	
	return pontos;
}

function statusMercado() {
  getMercado().done(function(result) {
    mercado_status = result.status_mercado;
    formatMercadoStatus();
    rodada_atual = result.rodada_atual;
  });
}

function getMercado() {
  return $.ajax({
    type: "GET",
    contentType: "application/json",
    dataType: "json",
    cache: false,
    timeout: 10000,
    url: "load-api.php?api=mercado-status",
    async: false,
    success: function(data) {
      return data;
    }
  });
}

function formatMercadoStatus() {
  var _mercado_status_wrapper = $("#mercado_status");
  if (mercado_status == 1) {
    _mercado_status_wrapper.html("Mercado aberto");
  } else if (mercado_status == 2) {
    _mercado_status_wrapper.html("Mercado fechado");
  } else {
    _mercado_status_wrapper.html("");
  }
}

function statusParciaisRodada() {
  getParciaisRodada().done(function(result) {
    atletas_pontuados = result.atletas;
  });
}

function getParciaisRodada() {
  return $.ajax({
    type: "GET",
    contentType: "application/json",
    dataType: "json",
    timeout: 10000,
    cache: false,
    url: "load-api.php?api=parciais-atletas",
    async: false,
    success: function(data) {
      return data;
    }
  });
}

function acionarBotoesOrdenacao() {
	$("#ordenacaoParcial").click(function() {
		linhas.sort(function(a, b) {
		    return parseFloat(b.pontuacao) - parseFloat(a.pontuacao);
		});
		apresentarResultado(linhas);
	});
	
	$("#ordenacaoPontuacaoGeral").click(function() {
		linhas.sort(function(a, b) {
		    return (parseFloat(b.pontuacaoGeral)+parseFloat(b.pontuacao)) - (parseFloat(a.pontuacaoGeral)+parseFloat(a.pontuacao));
		});
		apresentarResultado(linhas);
	});
}

