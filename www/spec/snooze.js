describe("user swipes card to left", function() {
	var div1 = document.createElement("DIV");
	div1.setAttribute("class", "mdl-card mdl-shadow--2dp");
	div1.id = "bluetooth";
	
 	describe("snooze", function() {
	
		it("should dismiss card forever", function() {
		toggleVisibility();
		snooze(div1.id);
		expect(localStorage.getItem(div1.id).not.toBeNull);
		expect(localStorage.getItem(div1.id).toBeDefined());
		
		});
	});

	describe("cancel", function() {
		
		var el = document.getElementById(div1.id);
	
		it("should cancel dismissing card forever", function() {
			cancel(div1.id);
			expect(localStorage.getItem(div1.id).toBeNull);
			expect(el.style.display.toBe("inherit"));
		});
	});

	describe("cancel all", function() {
	
	
		it("should show all snoozed cards again and remove from localstorage", function() {
			cancelAll()
			expect(localStorage.length().toEqual(0));
		});
	});

});