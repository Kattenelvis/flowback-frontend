import numpy as np
# Inputs: All historical bets, bets for the current poll, evaluations

historical_bets = np.array([0.6, 0.2, 0.8, 0.4])  # Example historical bets
historical_evaluations = np.array([1, 0, 1, 0])  # Example evaluations (1 for correct, 0 for incorrect)
current_bets = np.array([0.7, 0.3, 0.9, 0.5])  # Example current bets
# There are no current evaluations, because the evaluation phase is after betting phase

# Calculate: Bias adjusted bets
# https://en.wikipedia.org/wiki/Bias_of_an_estimator#Definition

# Edgecase: No bets have been done
# Edgecase: One better has made no bets
# Edgecase: One better has made all bets
# Edgecase: Evaluation has reached 50% on the vote (in this instance it counts as not evaluated)

# Calculate e's
# Calculate covariance matrix
# Calculate k's 
# Make sure dot product is 1
# All in Loke's paper