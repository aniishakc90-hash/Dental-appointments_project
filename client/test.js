import { Selector } from 'testcafe';

fixture('Dental Care Client Tests')
  .page('http://127.0.0.1:5500/client/appointments.html');

test('Appointments heading is visible', async t => {
  const heading = Selector('h1');

  await t
    .expect(heading.exists)
    .ok()
    .expect(heading.innerText)
    .contains('Appointments');
});

test('Add Appointment button exists', async t => {
  const addButton = Selector('a, button').withText('+ Add Appointment');

  await t
    .expect(addButton.exists)
    .ok();
});

test('Appointment data is displayed', async t => {
  const firstDataRow = Selector('table tbody tr, .appointments-list tr, .appointment-card').nth(0);

  await t
    .expect(firstDataRow.exists)
    .ok();
});