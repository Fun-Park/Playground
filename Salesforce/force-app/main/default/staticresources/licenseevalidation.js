//global vars
var timer;

$(document).ready(function() {    
    initLicenseeValidation();
});

function initLicenseeValidation() {
                                                
    $('legend:contains(HiddenFields)').each(function(){ 
        var one = $(this);
        one.hide(); 
        var two = one.next();
        two.hide();
        var three = two.next();
        three.hide();
        var four = three.next();
        four.hide();
    });
                                                
    $('legend:contains(Validate Licence)').each(function(){
        var addressGroup = $(this).next(); //parentDiv
        var ids = addressGroup.attr('id');

        //construct new address validation structure
        var avStruct = '\
        <div id="' + ids + '_cnt">\
        <div id="' + ids + '_lbl" class="label preField reqMark">Licence Search</div>\
        <div id="' + ids + '_inputCnt">\
        <input id="' + ids + '_input" type="text" autocomplete="off" style="width:100%" />\
        </div>\
        <div id="' + ids + '_results" class="addressResults"></div>\
        </div>';      
        $(this).after(avStruct);
        var pd = $('#' + ids + '_cnt');
        var sb = $('#' + ids + '_input');
        var rb = $('#' + ids + '_results');
        
        //pd.next().hide();
       
        
        $('#' + ids + '_input').on('keyup', function () {
            clearResults(ids);
            licenceSearch(ids, pd, sb, rb);
        });
        
        $('#' + ids + '_input').on('paste', function () {
            clearResults(ids);
            var element = this;
            setTimeout(function () {
                licenceSearch(ids, pd, sb, rb);
            }, 100);
        });            
    });
}

function licenceSearch(ids, pd, sb, rb){
    //set easy reference variables
    if(timer){
        clearTimeout(timer);
        timer = null;
    }		
    
    //get initial length of string
    var curLength = sb.val().length;
    
    if(curLength < 2){
        clearTimeout(timer);
        if(curLength == 0){					
            $("#" + ids + " select[title='Type']" ).prop("disabled", false);
            $('#' + ids + '_mr').click(function(){ pd.hide().next().show(); });
            $("#" + ids + " select[title='Result Found']").val($("#" + ids + " select[title='Result Found'] option:contains('No')").attr('id')); 
            hideSections();
            showSection('New Details');
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
            rb.html('Searching for licensee...');
            hideSections(); //JS Function 
            funcBuilderSearchJSToAPEX(ids, sb.val()); //Visualforce ActionFunction call to LicenceValidationController method
            clearTimeout(timer);
        } else {
        }
    }, 1500);	
}

function RedistributeResults(ids, results){
    rb = $('#' + ids + '_results');
    if(results.length==0){      
        //add manual option
        //rb.append('<div id="' + ids + '_mr" class="manResult">Licencee wasn\'t found - Enter details manually</div>');
        rb.html('Licencee wasn\'t found - Select Type below to enter details manually');
        $('#' + ids + '_mr').click(function(){ pd.hide().next().show(); });
        $("#" + ids + " select[title='Result Found']").val($("#" + ids + " select[title='Result Found'] option:contains('No')").attr('id')); 
    }
    else{
        rb.html('Result Found');
        
        //set the option to yes and fire the onchange trigger
        //
        
        $("#"+ids).find('option:selected').removeAttr("selected");
                
        var yesOptionId = $("#" + ids + " select[title='Result Found'] option:contains('Yes')").attr('id');
        $("#"+yesOptionId).prop("selected", true); 
        $("#"+yesOptionId).selected = true;
        $("#"+yesOptionId).change();        
        $("#"+yesOptionId).trigger("change");
        showSection("Existing Fields");    
        hideSection("New Details");
        $("#" + ids + " select[title='Result Found']").val($("#" + ids + " select[title='Result Found'] option:contains('Yes')").attr('id')); 

        results = results.trim();
        results = (results.length && results[0] == '{') ? results.slice(1) : results;
        console.log('$$'+results);
        results = (results.length && results[results.length-1] == '}') ? results.slice(0, -1) : results;
        console.log('$$'+results);
     	var array = results.split(', ');
        console.log(array.length);
        for(var i=0; i<array.length; i++){
            var thisElement = array[i].split('=')
            //if the field type is a menu/drop down, select the relevant option value
            if(thisElement[0]=='Type'){
                if(thisElement[1]=='Organisation' || thisElement[1]=='Professional') thisElement[1]='Company';  
                console.log('***'+thisElement[1]+'***');
                $("#" + ids + " select[title='"+thisElement[0]+"']").val($("#" + ids + " select[title='"+thisElement[0]+"'] option:contains('" + thisElement[1] + "')").attr('id'));                
                $("#" + ids + " select[title='"+thisElement[0]+"']" ).focus(); 
                $("#" + ids + " select[title='"+thisElement[0]+"']" ).focusout();  
                showSection(thisElement[1]);                
                $("#" + ids + " select[title='"+thisElement[0]+"']" ).prop("disabled", true);	
            }
            else{
                //$("#" + ids + " input[title='"+thisElement[0]+"']" ).prop("disabled", false);	    
                $("#" + ids + " input[title='"+thisElement[0]+"']" ).val(thisElement[1])
                $("#" + ids + " input[title='"+thisElement[0]+"']" ).show(); 
                $("#" + ids + " input[title='"+thisElement[0]+"']" ).focus(); 
                $("#" + ids + " input[title='"+thisElement[0]+"']" ).focusout(); 
                $("#" + ids + " input[title='"+thisElement[0]+"']" ).removeClass('offstate')
            }
        }
    }    
}

function showSection(SectionName){
    $('legend:contains('+SectionName+' Section)').each(function(){
        $(this).parent().removeClass('offstate');           
    });  
}

function hideSection(SectionName){
    $('legend:contains('+SectionName+' Section)').each(function(){
        $(this).parent().addClass('offstate');         
    });      
}


function hideSections(){
    $('legend:contains(Individual Section)').each(function(){
        $(this).parent().addClass('offstate');           
    });   
    
    $('legend:contains(Company Section)').each(function(){
        $(this).parent().addClass('offstate');           
    });     
}

function clearResults(ids){
    $('#' + ids + ' input, #' + ids + ' select').val('');
}

