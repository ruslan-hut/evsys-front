import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Color, DataItem, ScaleType } from '@swimlane/ngx-charts';

import { BarLineChartComponent } from './bar-line-chart.component';

describe('BarLineChartComponent', () => {
  let fixture: ComponentFixture<BarLineChartComponent>;
  let component: BarLineChartComponent;

  const scheme: Color = {
    name: 'test',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#3f51b5', '#e91e63', '#4caf50']
  };

  const bars: DataItem[] = [
    { name: 'jan 2026', value: 10 },
    { name: 'feb 2026', value: 20 },
    { name: 'mar 2026', value: 30 }
  ];

  function setup(lineResults: DataItem[] = []): void {
    TestBed.configureTestingModule({
      imports: [BarLineChartComponent, NoopAnimationsModule]
    });

    fixture = TestBed.createComponent(BarLineChartComponent);
    component = fixture.componentInstance;
    // jsdom reports no size for anything, so the chart would fall back to its
    // own defaults; a fixed view keeps the geometry assertions deterministic.
    fixture.componentRef.setInput('view', [600, 400]);
    fixture.componentRef.setInput('scheme', scheme);
    fixture.componentRef.setInput('results', bars);
    fixture.componentRef.setInput('lineResults', lineResults);
    fixture.componentRef.setInput('barSeriesName', 'Current period');
    fixture.componentRef.setInput('lineSeriesName', 'Previous year');
    fixture.detectChanges();
  }

  const linePath = (): SVGPathElement | null =>
    fixture.nativeElement.querySelector('path.wb-comparison-line');

  const markers = (): SVGCircleElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('circle.wb-comparison-marker'));

  /** The x the bar for `label` is centred on, in chart coordinates. */
  const barCenter = (label: string): number =>
    component.xScale(label) + component.xScale.bandwidth() / 2;

  afterEach(() => TestBed.resetTestingModule());

  describe('without a comparison series', () => {
    beforeEach(() => setup());

    // Falling back to a plain bar chart is what lets the dashboard leave the
    // component in place with the comparison switched off.
    it('draws no line and reserves no legend', () => {
      expect(linePath()).toBeNull();
      expect(markers().length).toBe(0);
      expect(component.legend).toBe(false);
    });

    it('keeps colouring bars by category', () => {
      const colors = bars.map(bar => component.colors.getColor(bar.name));
      expect(new Set(colors).size).toBe(bars.length);
    });
  });

  describe('with a comparison series', () => {
    const line: DataItem[] = [
      { name: 'jan 2026', value: 8, extra: { label: 'jan 2025' } },
      { name: 'feb 2026', value: 26, extra: { label: 'feb 2025' } },
      { name: 'mar 2026', value: 24, extra: { label: 'mar 2025' } }
    ];

    beforeEach(() => setup(line));

    it('puts every line point on the centre of its bar', () => {
      const drawn = markers().map(marker => Number(marker.getAttribute('cx')));
      expect(drawn).toEqual(bars.map(bar => barCenter(String(bar.name))));
    });

    it('draws one connected line', () => {
      expect(linePath()!.getAttribute('d')!.match(/M/g)!.length).toBe(1);
    });

    // A line point above every bar would be clipped if the bars alone set the
    // scale - February's 26 is higher than any bar but the last.
    it('scales the axis to cover both series', () => {
      expect(component.getYDomain()[1]).toBeGreaterThanOrEqual(30);
      expect(component.yScale(26)).toBeGreaterThan(0);
    });

    it('switches colour from meaning category to meaning series', () => {
      const barColors = bars.map(bar => component.colors.getColor(bar.name));
      expect(new Set(barColors).size).toBe(1);
      expect(component.seriesColors.getColor('Current period')).not
        .toBe(component.seriesColors.getColor('Previous year'));
      expect(component.lineColor).toBe(component.seriesColors.getColor('Previous year'));
    });

    it('names both series in the legend', () => {
      expect(component.legend).toBe(true);
      expect(component.legendOptions.domain).toEqual(['Current period', 'Previous year']);
    });

    it('offers both series to the tooltip', () => {
      expect(component.tooltipResults.map(series => series.name))
        .toEqual(['Current period', 'Previous year']);
      expect(component.tooltipResults[1].series[0].extra).toEqual({ label: 'jan 2025' });
    });

    it('anchors the tooltip over the bar it describes', () => {
      expect(component.centeredXScale('feb 2026')).toBe(barCenter('feb 2026'));
    });
  });

  // Absent data is not zero consumption, so the line has to break rather than
  // dive to the axis and back.
  it('breaks the line where a category has no comparison point', () => {
    setup([
      { name: 'jan 2026', value: 8 },
      { name: 'mar 2026', value: 24 }
    ]);

    expect(markers().length).toBe(2);
    expect(linePath()!.getAttribute('d')!.match(/M/g)!.length).toBe(2);
  });

  // A point the bars have no category for cannot be placed on the axis at all.
  it('ignores comparison points outside the bar categories', () => {
    setup([{ name: 'dec 2025', value: 8 }]);

    expect(markers().length).toBe(0);
    expect(linePath()!.getAttribute('d')).toBe('');
  });
});
