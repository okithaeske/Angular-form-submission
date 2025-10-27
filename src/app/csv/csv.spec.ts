import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Csv } from './csv';

describe('Csv', () => {
  let component: Csv;
  let fixture: ComponentFixture<Csv>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Csv]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Csv);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
