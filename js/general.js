var scope;
var auxSaida;
var auxAgoraEmMinutos;
var auxIntervaloAlmoco;
var auxRestante;
var interval;
var lastAlert;
var myApp;

$(document).ready(function() {
	$('input').mask('00:00');
	
	myApp = angular.module('StarterApp', ['ngMaterial']);
	
	myApp.controller('LeftCtrl', function ($scope, $timeout, $mdSidenav, $log) {
		$scope.close = function () {
		  $mdSidenav('left').close()
			.then(function () { /* Callback */ });
		};
		
		scope = $scope;
	})
	
	myApp.controller('AppCtrl', function ($scope, $timeout, $mdSidenav, $mdUtil, $log) {
		$scope.ptBR = 'pt-br';
		$scope.enUS = 'en-us';
		$scope.language = '';
		$scope.language = 'pt-br'
		$scope.horaEntrada = '07:25';
		$scope.horaSaida = '11:50';
		$scope.horaEntradaAlmoco = '12:50';
		$scope.imagePath = 'images/horizon.jpg';
		$scope.usaflagSrcIcon = './images/usa.png';
		$scope.braflagSrcIcon = './images/bra.png';
		$scope.flagSrcIcon = '';
		
		$scope.setLanguage = function(language) {
			$scope.language = language;
			$scope.flagSrcIcon = (language == $scope.ptBR) ? $scope.usaflagSrcIcon : (language == $scope.enUS) ? $scope.braflagSrcIcon : $scope.braflagSrcIcon;
		}
		
		$scope.setLanguage($scope.ptBR);
		
		/**
		 * Build handler to open/close a SideNav; when animation finishes
		 * report completion in console
		 */
		function buildToggler(navID) {
		  var debounceFn =  $mdUtil.debounce(function(){
				$mdSidenav(navID).toggle().then(function () {
					$log.debug("toggle left is done");
				});
			  },200);
		  return debounceFn;
		};
		$scope.toggleLeft = buildToggler('left');
		$scope.calculate = function() {
			myFunction();
			scope.close();
		};
		$scope.translate = function() {
			translateTool($scope);
		};
		
		scope = $scope;
		configureApp();
	});
	
	myApp.config(function($mdThemingProvider) {
		$mdThemingProvider.theme('default')
		.primaryPalette('blue');
	});
	
});

function configureApp() {
	$(document).keypress(function(e) {
		if(e.which == 13) {
			scope.calculate();
		}
	});
	
	$("#horaSaida").focusout(function() {
		myFunction();
	})
	
	$("#horaEntradaAlmoco").focusout(function() {
		myFunction();
	})
	
	$('.entrance').clockpicker({
		placement: 'bottom',
		align: 'left',
		autoclose: true,
		'default': 'now'
	});
	
	$('.beforeLunch').clockpicker({
		placement: 'bottom',
		align: 'left',
		autoclose: true,
		'default': 'now'
	});
	
	$('.afterLunch').clockpicker({
		placement: 'middle',
		align: 'left',
		autoclose: true,
		'default': 'now'
	});
	
	myFunction();
	
	interval = setInterval(function() {
		intervalFunction(true);
	}, 500);
}

function intervalFunction(isToClearInterval) {
	var isToAlert = !((Date.now() - lastAlert) < 1000);
	document.getElementById("restanteSpan").innerText = getHorasRestantes(auxSaida, auxIntervaloAlmoco, isToAlert, isToClearInterval);
}

function myFunction() {
	var horaEntrada = scope.horaEntrada.split(':');
	var horaSaida = scope.horaSaida.split(':');
	var horaEntradaAlmoco = scope.horaEntradaAlmoco.split(':');
	 
	var horaEntradaMinutos = ((horaEntrada[0] * 60) + parseInt(horaEntrada[1]));
	var horaSaidaMinutos = ((horaSaida[0] * 60) + parseInt(horaSaida[1]));
	
	var horaEntradaAlmocoMinutos = ((horaEntradaAlmoco[0] * 60) + parseInt(horaEntradaAlmoco[1]));

	// Calcula a Saida
	var saida = (horaEntradaAlmocoMinutos + (525 - (horaSaidaMinutos - horaEntradaMinutos)));
	
	// Até dia 18/09 terei acréscimo de 15 minutos no horário.
	// saida += 15;
	
	auxSaida = saida;
	
	// Calcula o intervalo do almoço em minutos
	var intervaloAlmoco = horaEntradaAlmocoMinutos - horaSaidaMinutos;
	auxIntervaloAlmoco = intervaloAlmoco;
	// Calcula tempo restante da jornada de trabalho
	var horasRestantes = getHorasRestantes(saida, intervaloAlmoco, true, true);
	
	// Monta string com a hora de sair
	saida = (saida / 60).toFixed(2);
	saida = saida.split('.');
	var minutos = formatMinutos(saida[1]);
	saida = saida[0] + ':' + minutos;
	
	// Adiciona na tela restanteSpan
	document.getElementById("restanteSpan").innerText = horasRestantes;
	// Adiciona na tela almocoSpan
	var intervaloMudou = ((document.getElementById("almocoSpan").innerText) != intervaloAlmoco);
	if (intervaloMudou) {
		$("#almocoSpan").animate({opacity: "0"}, {complete: function() {
			document.getElementById("almocoSpan").innerText = intervaloAlmoco;
			$("#almocoSpan").animate({opacity: "1"});
		}});
	}
	// Adiciona na tela saidaSpan
	document.getElementById("saidaSpan").innerText = saida;
}

/**
 * Função que calcula a previsão de partir com base no horário da máquina.
 */
function getHorasRestantes(saida, intervaloAlmoco, alert, isToClearInterval) {
	var currentdate = new Date();
	var currentHour = currentdate.getHours();
	var currentMinutes = currentdate.getMinutes();
	
	auxAgoraEmMinutos = ((currentHour * 60) + currentMinutes);
	
	var restante = (saida - auxAgoraEmMinutos);
	auxRestante = restante;
	//restante = restante - intervaloAlmoco; // Descomentar caso queira calcular com o desconto do intervalo de almoço
	if (restante <=0) {
		restante = 0;
		
		if (alert) {
			lastAlert = Date.now();
			window.alert("Hora de partir");
		}
		
		if (alert) {
			clearInterval(interval);
		}
	} else {
		if (restante <= 5) {
			$("#restanteSpan").css("color", "red");
		} else if ($("#restanteSpan").css("color") == "rgb(255, 0, 0)") {
			$("#restanteSpan").css("color", "black");
		}
		restante = "" + (restante / 60).toFixed(2);
		restante = restante.split('.');
		var minutosRestante = formatMinutos(restante[1]);
		restante = restante[0] + ':' + minutosRestante;
	}		
	return restante;
}

function formatRestante(restante) {
	restante = "" + (restante / 60).toFixed(2);
	restante = restante.split('.');
	var minutosRestante = formatMinutos(restante[1]);
	restante = restante[0] + ':' + minutosRestante;
}

/**
 * Função que formata e retorna os minutos de qualquer horário recebido por parametro
 * @param minutos - Valor resultante de um horário em minutos dividido por 60 Ex. (525 / 60) = 8,75 = "75"
 */	
function formatMinutos(minutos) {
	var minutos = (parseInt(minutos) / 100) * 60;
	minutos = (minutos != 0) ? minutos.toFixed(0) : '00';
	
	if (minutos >= 1 && minutos <= 9) {
		minutos = "0" + minutos;
	}
	
	return minutos;
}

function translateTool($scope) {
	if ($scope.language == 'pt-br') {
		translateEnglish($scope);
	} else {
		translatePortuguese($scope);
	}
}

function translateEnglish($scope) {
	$scope.setLanguage("en-us");
	$(".entrance").text("Entry Time: ");
	$(".your-time").text("Your time");
	$(".beforeLunch").text("Start of lunch: ");
	$(".afterLunch").text("End of lunch: ");
	$(".remainingHours").text("Time left (hours): ");
	$(".lunchTime").text("Lunch break (minutes): ");
	$(".timeToLeave").text("Time to Leave: ");
	$(".configure").text("Settings");
}

function translatePortuguese($scope) {
	$scope.setLanguage("pt-br");
	$(".entrance").text("Hora entrada: ");
	$(".your-time").text("Seu horário");
	$(".beforeLunch").text("Hora Saída para almoço: ");
	$(".afterLunch").text("Hora entrada após almoço: ");
	$(".remainingHours").text("Horas Restantes: ");
	$(".lunchTime").text("Intervalo Almoço: ");
	$(".timeToLeave").text("Horário saída: ");
	$(".calculateButton").text("Calcular");
	$(".configure").text("Configurações");
}