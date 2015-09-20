describe("selectPanSwipable", function() {
	descripe("MakeElemPanSwipable", function() {
		it("calls the requestElementUpdate() function", function() {
			var fakeMakeElemPanSwipable = new fakeMakeElemPanSwipable();
			spyOn(fakeMakeElemPanSwipable, "requestElementUpdate()");
			fakeMakeElemPanSwipable.resetElement();
			expect(fakeMakeElementPanSwipable.requestElementUpdate).toHaveBeenCalled();
		});
	});
				//	descripe("resetElement", function() {
			
	//	});
                	
        //	});
			
			
		});
		
	