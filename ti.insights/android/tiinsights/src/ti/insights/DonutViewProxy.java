package ti.insights;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;

@Kroll.proxy(creatableInModule=TiinsightsModule.class)
public class DonutViewProxy extends TiViewProxy {
	private UIDonutView donutView;

	public DonutViewProxy() {
		super();
	}

	@Override
	public TiUIView createView(Activity activity) {
		donutView = new UIDonutView(this);
		return donutView;
	}
	
	@Kroll.setProperty @Kroll.method
	public void setColor(String newColor) {
		donutView.setColor(TiConvert.toColor(newColor));
	}
	
	@Kroll.setProperty @Kroll.method
	public void setData(Object newData) {
		donutView.setData(newData);
	}
}