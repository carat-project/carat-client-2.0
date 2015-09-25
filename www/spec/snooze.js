describe("snooze", function() {
	
	var id = "bluetooth"; 
	
	it("should dismiss card forever", function() {
		toggleVisibility();
		snooze(id);
		expect(localStorage.getItem(id).not.toBeNull);
		expect(localStorage.getItem(id).toBeDefined());
		
	});
});

describe("cancel", function() {
	
	var id = "bluetooth";
	var el = document.getElementById(id);
	
	it("should cancel dismissing card forever", function() {
		cancel(id);
		expect(localStorage.getItem(id).toBeNull);
		expect(el.style.display.toBe("inherit"));
	});
});