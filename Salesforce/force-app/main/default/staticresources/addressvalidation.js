 //global vars
	var timer;
	
	//=========================//
	//==== start functions ====//
	//=========================//
	function applyResults(ids, aObject){
	   
		if(aObject == null){
			//place error here
			alert('Failed to enter address data, please try again or enter your address manually');
			return;
		}
		
		//assign values to the appropriate fields
		$('#' + ids + '_cnt').next().show();
		$("#" + ids + " input[title='Unit Number']" ).val(aObject.unitNumber);
        $("#" + ids + " input[title='Unit Number']" ).focus();
        $("#" + ids + " input[title='Unit Number']" ).focusout();         
		$("#" + ids + " input[title='Street Number']" ).val(aObject.streetNumber);
        $("#" + ids + " input[title='Street Number']" ).show();
        $("#" + ids + " input[title='Street Number']" ).focus();
        $("#" + ids + " input[title='Street Number']" ).focusout();
		$("#" + ids + " input[title='Street Name']" ).val(aObject.streetName)
        $("#" + ids + " input[title='Street Name']" ).focus().focusout();
		$("#" + ids + " input[title='Street Type']" ).val(aObject.streetType);
		$("#" + ids + " input[title='Suburb']" ).val(aObject.suburb);
		$("#" + ids + " select[title='State']").val($("#" + ids + " select[title='State'] option:contains('" + aObject.stateCode + "')").attr('id'));
		$("#" + ids + " input[title='Postcode']" ).val(aObject.postCode);            
		$('#' + ids + '_cnt').next().hide();
	}

	function clearResults(ids){
		$('#' + ids + ' input, #' + ids + ' select').val('');
	}

	function addBreakdown(alList){
		console.log('received addbreakdown call');
		console.log(alList);
	
		//initalise variables
        this.country = 'Australia'; //new EDQ "AUE" region response doens't return a country :/
		this.postCode = alList[0];
		this.stateCode = alList[1];
		this.suburb = alList[2];	
		this.streetType = '';
		this.streetName = '';
		this.streetNumber = '';
		this.unitNumber = '';
		

		
		var streetBD = alList[3].split(/\s+/);
		
		var gotSN = false;
		
		console.log('street db: ' + streetBD)
		console.log(country);
		console.log(postCode);
		console.log(stateCode);
		console.log(suburb);	
		
		for(i = streetBD.length -1; i >= 0; i--){
			if(i == streetBD.length -1){
				//set street type
				streetType = streetBD[i];
				console.log('1: ' + streetType);
				
			} else if(i == streetBD.length - 2){
				//set street name
				streetName = streetBD[i];
				console.log('2: ' + streetName);
			} else if(i < streetBD.length - 2){
				//haven't got to the street number yet - add to street name			
				if(gotSN == false){				
					if(streetBD[i].match(/\d+/g) == null){
						//doesn't have numbers - assume part of street name
						streetName = streetBD[i] + ' ' + streetName;
						console.log('2: ' + streetName);
					} else {
						//start of unit number
						streetNumber = streetBD[i];
						console.log('3: ' + streetNumber);
						gotSN = true;
					}
				} else {
					//add everything else to the unit number
					if(unitNumber.length == 0){
						unitNumber = streetBD[i];					
						console.log('4: ' + unitNumber);
					} else {
						unitNumber = streetBD[i] + ' ' + unitNumber;
						console.log('4: ' + unitNumber);
					}
				}
			}	
		}
		
		if(alList.length > 4){
			//add the remaining lines to the
			for(i = 5; i < alList.length; i++){		
				unitNumber = alList[i] + ' ' + unitNumber;
				console.log('4: ' + unitNumber);
			}
		}
		return this;
	}
	
	function qasGetAddressBreakdown(moniker, address, ids, pd, sb, rb){
		//clear results box and set the search box value to the select address
		rb.html('');
		sb.val(address);
		
		var xhr = new XMLHttpRequest();
		xhr.open('POST', 'https://ws3.ondemand.qas.com/ProOnDemand/V3/ProOnDemandService.asmx');
		xhr.setRequestHeader('Content-Type','text/xml;charset=UTF-8');
		xhr.setRequestHeader('soapAction', 'http://www.qas.com/OnDemand-2011-03/DoGetAddress');
		xhr.setRequestHeader('auth-token', '10ecf79c-345d-46ac-aca3-cf773eac90d6');
		xhr.setRequestHeader('x-requested-with', 'XMLHttpRequest');
		
		var sr = 
			'<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ond="http://www.qas.com/OnDemand-2011-03">' +
				'<soapenv:Body>' +
					'<ond:QAGetAddress Localisation="AUE">' +
						'<ond:Country>AUE</ond:Country>' +
						'<ond:Layout>MSDCRM2011A</ond:Layout>' +
						'<ond:Moniker>' + moniker + '</ond:Moniker>' +
					'</ond:QAGetAddress>' +
				'</soapenv:Body>' +
			'</soapenv:Envelope>'
		
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200) {
				
				//get response address line items
				var response = $(xhr.responseText).find('qaaddress');
				console.log('qaaddress response');					
				console.log(response);        
				var alList = new Array();
				$(response).find('addressLine').each(function(){
					var line = $(this).find('Line');
					if (line.text().length > 0){
						alList.unshift(line.text());
						console.log(line.text());
					}
				});	
				//remove the database reference line as it's not needed
				alList.splice(0,1);
				
				console.log('this is the refined result list');
				console.log(alList);
				
				//send the response to the response handler
				console.log('sending response to addbd function');
				var aObject = addBreakdown(alList);
				console.log('processed responss');
				console.log(aObject);
				
				applyResults(ids, aObject);
				
			} else {
				return null; //error out on null return 					
			}
		};
		
		//send request
		xhr.send(sr);	
	}
	
	function addressSearch(ids, pd, sb, rb){
		//set easy reference variables
		if(timer){
		   clearTimeout(timer);
		   timer = null;
		}		
			
		//get initial length of string
		var curLength = sb.val().length;
		console.log('curLength: ' + curLength);
		
		if(curLength < 8){
			clearTimeout(timer);
			if(curLength == 0){					
				rb.html('');                    
			} else {
				rb.html('Waiting...');
			}
			return; 
		}
	
		//set time out and check that the length hasn't changed
		//this ensures the user has stopped typing
		timer = setTimeout(function(){
			console.log('curLength: ' + curLength + ' vs ' + sb.val().length);
			if(curLength == sb.val().length){
				rb.html('Searching...');
                try{
				qasValidation(ids, pd, sb, rb)
                }
                catch(e){
                    //Address validation failing in IE - this work around allows the manual input of the address until the validation is fixed
                    console.log('EXCEPTION CAUGHT: '+e);
                    rb.html('');
                    rb.append('<div id="' + ids + '_mr" class="manResult">Address search has failed - Enter Address Manually</div>');
                    $('#' + ids + '_mr').click(function(){ pd.hide().next().show(); });                    
                }
				clearTimeout(timer);
			} else {
			}
		}, 1500);	
	}
	
	function qasValidation(ids, pd, sb, rb){
		var xhr = new XMLHttpRequest();
		xhr.open('POST', 'https://ws3.ondemand.qas.com/ProOnDemand/V3/ProOnDemandService.asmx');
		xhr.setRequestHeader('Content-Type','text/xml;charset=UTF-8');
		xhr.setRequestHeader('soapAction', 'http://www.qas.com/OnDemand-2011-03/DoSearch');
		xhr.setRequestHeader('auth-token', '10ecf79c-345d-46ac-aca3-cf773eac90d6');
		xhr.setRequestHeader('x-requested-with', 'XMLHttpRequest');
		
		var sr = 
			'<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ond="http://www.qas.com/OnDemand-2011-03">' +
				'<soapenv:Body>' +
					'<ond:QASearch Localisation="AUE">' +
						'<ond:Country>AUE</ond:Country>' +
						'<ond:Layout>MSDCRM2011</ond:Layout>' +
						'<ond:Engine Flatten="true" Threshold="20" Intensity="Close">Intuitive</ond:Engine>' +
						'<ond:Search>' + sb.val() + '</ond:Search>' +
					'</ond:QASearch>' +
				'</soapenv:Body>' +
			'</soapenv:Envelope>'
		
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200) {
	
				//declare response text variable
				var rt = "";
				
				//clear response box
				rb.html('');
				
				//add manual option
				rb.append('<div id="' + ids + '_mr" class="manResult">My address wasn\'t found - Enter Address Manually</div>');
				$('#' + ids + '_mr').click(function(){ pd.hide().next().show(); });
				
				//generate response items
				$(xhr.responseText).find('PicklistEntry').each(function(index){
					rb.append('<div class="asResult ' + ids + '_ar" Moniker="' + $(this).find('moniker').text() + '">' + $(this).find('PartialAddress').text() + '</div>');
				});
				console.log(rt);
				
				//Initialise the onlick refined search handler                    
				$('.asResult.' + ids + '_ar').click(function(){ /*alert($(this).attr('moniker'));*/ qasGetAddressBreakdown($(this).attr('moniker'),$(this).html(), ids, pd, sb, rb); });
				
			} else {
				
			}
		};
		
		//send request
		xhr.send(sr);
		
	}
	
	function initAddressValidation() {
		$('legend:contains(Address Validation Group)').each(function(){
			var addressGroup = $(this).next(); //parentDiv
			var ids = addressGroup.attr('id');
		
			//construct new address validation structure
			var avStruct = '\
			<div id="' + ids + '_cnt">\
				<div id="' + ids + '_lbl" class="label preField reqMark">Address Search</div>\
				<div id="' + ids + '_inputCnt">\
					<input id="' + ids + '_input" type="text" autocomplete="off" style="width:100%" />\
				</div>\
				<div id="' + ids + '_results" class="addressResults"></div>\
			</div>';
			
			$(this).after(avStruct);
			
			var pd = $('#' + ids + '_cnt');
			var sb = $('#' + ids + '_input');
			var rb = $('#' + ids + '_results');
			
			pd.next().hide();
			
			$('#' + ids + '_input').on('keyup', function () {
				clearResults(ids);
				addressSearch(ids, pd, sb, rb);
			});
		
			$('#' + ids + '_input').on('paste', function () {
			  clearResults(ids);
			  var element = this;
			  setTimeout(function () {
				addressSearch(ids, pd, sb, rb);
			  }, 100);
			});
		});
	}
	
	$(document).ready(function() {            
		initAddressValidation();
	});