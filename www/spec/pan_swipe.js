describe("selectPanSwipable", function() {
	var elem = document.createElement("div"); 
	
	it("should make an element pannable and swipable", function() {
		makeElemPanSwipable(elem);
		expect(elem.classList.contains("animation")).toBe(true);
	});
});
	
		
	