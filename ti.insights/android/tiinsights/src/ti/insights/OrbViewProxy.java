package ti.insights;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;

@Kroll.proxy(creatableInModule=TiinsightsModule.class)
public class OrbViewProxy extends TiViewProxy {
	private UIOrbView orbView;
	
	public OrbViewProxy() {
		super();
	}

	@Override
	public TiUIView createView(Activity activity) {
		orbView = new UIOrbView(this);
		return orbView;
	}
	
	@Kroll.setProperty @Kroll.method
	public void setPercent(int newPercent) {
		orbView.setPercent(newPercent);
	}
	
	@Kroll.method
	public void showColor() {
		orbView.showColor();
	}
	
	@Kroll.method
	public void showGray() {
		orbView.showGray();
	}
}
